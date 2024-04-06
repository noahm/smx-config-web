import * as Bacon from "baconjs";
import { collatePackets, type DataPacket } from "./state-machines/collate-packets";
import { API_COMMAND, char2byte } from "./api";
import { SMXConfig, type Decoded } from "./commands/config";
import { SMXDeviceInfo } from "./commands/data_info";
import { StageInputs } from "./commands/inputs";
import {
  HID_REPORT_INPUT,
  HID_REPORT_INPUT_STATE,
  requestSpecialDeviceInfo,
  send_data,
} from "./packet";
import { SMXSensorTestData, SensorTestMode } from "./commands/sensor_test";

class SMXEvents {
  private dev;
  private startedSend$: Bacon.Bus<boolean>;
  input$;
  inputState$;
  otherReports$;
  output$;

  constructor(dev: HIDDevice) {
    this.dev = dev;

    // Main USB Ingestor
    this.input$ = Bacon.fromEvent<HIDInputReportEvent>(dev, "inputreport");

    // Panel Input State (If a panel is active or not)
    this.inputState$ = this.input$
      .filter((e) => e.reportId === HID_REPORT_INPUT_STATE)
      .map((e) => StageInputs.decode(e.data, true));

    // All other reports (command responses)
    const report$ = this.input$
      .filter((e) => e.reportId === HID_REPORT_INPUT)
      .map((e) => e.data)
      .filter((d) => d.byteLength !== 0)
      .withStateMachine({ currentPacket: new Uint8Array() }, collatePackets);

    this.otherReports$ = (report$.filter((e) => e.type === "data") as Bacon.EventStream<DataPacket>).map(
      (e) => e.payload,
    );

    const finishedCommand$ = report$
      .filter((e) => e.type === "host_cmd_finished")
      .map((e) => e.type === "host_cmd_finished");

    // this.otherReports$.onValue((value) => console.log("Packet: ", value));

    finishedCommand$.log("Cmd Finished");

    // we write a `true` to this whenever a series of packets is going out to the device
    this.startedSend$ = new Bacon.Bus<boolean>();

    // true means "it's ok to send", false means "don't send"
    const okSend$ = new Bacon.Bus<boolean>()
      .merge(finishedCommand$)  // Returns true when host_cmd_finished
      .merge(this.startedSend$.not())  // Return false when starting to send
      .toProperty(true);

    // Main USB Output
    this.output$ = new Bacon.Bus<Array<number>>();

    // Config writes should only happen at most once per second. 
    const configOutput$ = this.output$
      .filter((e) => e[0] === API_COMMAND.WRITE_CONFIG_V5)
      .throttle(1000);

    const otherOutput$ = this.output$
      .filter((e) => e[0] !== API_COMMAND.WRITE_CONFIG_V5);

    const combinedOutput$ = new Bacon.Bus<Array<number>>()
      .merge(configOutput$)
      .merge(otherOutput$)
      .bufferingThrottle(100)
      .takeWhile(okSend$)
      .doAction(_ => this.startedSend$.push(true))
      .onValue(async (value) => await this.writeToHID(value));
  }

  private async writeToHID(value: Array<number>) {
    //this.startedSend$.push(true);
    console.log("writing to HID");
    await send_data(this.dev, value);
  }
}

export class SMXStage {
  private dev: HIDDevice;
  private events: SMXEvents;
  info: SMXDeviceInfo | null = null;
  config: SMXConfig | null = null;
  test: SMXSensorTestData | null = null;
  inputs: Array<boolean> | null = null;
  private test_mode: SensorTestMode = SensorTestMode.CalibratedValues; // TODO: Maybe we just let this be public
  private debug = true;

  constructor(dev: HIDDevice) {
    this.dev = dev;
    this.events = new SMXEvents(this.dev);

    // Set the device info handler
    this.events.otherReports$
      .filter((e) => e[0] === char2byte("I")) // We send 'i' but for some reason we get back 'I'
      .onValue((value) => this.handleDeviceInfo(value));

    // Set the config request handler
    this.events.otherReports$
      .filter((e) => e[0] === API_COMMAND.GET_CONFIG_V5)
      .onValue((value) => this.handleConfig(value));

    // Set the test data request handler
    this.events.otherReports$
      .filter((e) => e[0] === API_COMMAND.GET_SENSOR_TEST_DATA)
      .onValue((value) => this.handleTestData(value));

    // Set the inputs data request handler
    this.events.inputState$.onValue((value) => this.handleInputs(value));
  }

  async init() {
    /**
     * This is a special RequestDeviceInfo packet. This is the same as sending an
     * 'i' command, but we can send it safely at any time, even if another
     * application is talking to the device. Thus we can do this during enumeration.
     */
    //await requestSpecialDeviceInfo(this.dev); // Modify `send_data` to accept this somehow?

    this.updateDeviceInfo();

    // Request the config for this stage
    this.updateConfig();

    // Request some initial test data
    this.updateTestData();
  }

  updateDeviceInfo() {
    this.events.output$.push([API_COMMAND.GET_DEVICE_INFO]);
  }

  updateConfig() {
    this.events.output$.push([API_COMMAND.GET_CONFIG_V5]);
  }

  updateTestData(mode: SensorTestMode | null = null) {
    if (mode) {
      this.test_mode = mode;
    }
   this.events.output$.push([API_COMMAND.GET_SENSOR_TEST_DATA, this.test_mode]);
  }

  private handleConfig(data: Uint8Array) {
    this.config = new SMXConfig(Array.from(data));

    // Right now I just want to confirm that decoding and encoding gives us back the same data
    const encoded_config = this.config.encode();
    if (encoded_config) {
      const buf = new Uint8Array(encoded_config.buffer);
      console.log("Config Encodes Correctly: ", data.slice(2, -1).toString() === buf.toString());
    }
    console.log("Got Config: ", this.config);
  }

  private handleTestData(data: Uint8Array) {
    this.test = new SMXSensorTestData(Array.from(data), this.test_mode);

    console.log("Got Test: ", this.test);
  }

  private handleDeviceInfo(data: Uint8Array) {
    this.info = new SMXDeviceInfo(Array.from(data));

    console.log("Got Info: ", this.info);
  }

  private handleInputs(data: Decoded<typeof StageInputs>) {
    this.inputs = [
      data.up_left,
      data.up,
      data.up_right,
      data.left,
      data.center,
      data.right,
      data.down_left,
      data.down,
      data.down_right,
    ];
  }
}
