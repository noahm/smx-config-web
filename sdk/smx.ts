import * as Bacon from "baconjs";
import { collatePackets, type AckPacket, type DataPacket } from "./state-machines/collate-packets";
import { API_COMMAND, char2byte } from "./api";
import { SMXConfig, type Decoded } from "./commands/config";
import { SMXDeviceInfo } from "./commands/data_info";
import { StageInputs } from "./commands/inputs";
import { HID_REPORT_INPUT, HID_REPORT_INPUT_STATE, send_data } from "./packet";
import { SMXSensorTestData, SensorTestMode } from "./commands/sensor_test";
import { RGB } from "./utils";

/**
 * Class purely to set up in/out event stream "pipes" to properly throttle and sync input/output from a stage
 * this does not read or write to a stage at all. consumers can write to `output$`, and pass throttled events from
 * `eventsToSend$` on to a stage. Read from `inputState$` to see panel pressed state reports, and from `otherReports$`
 * to see responses to commands sent to the stage.
 **/
class SMXEvents {
  /** read from this to see the constant on/off state reports for all panels */
  public readonly inputState$;
  /** read from this to see all reports sent by the stage in response to a command */
  public readonly otherReports$: Bacon.EventStream<Uint8Array>;
  /** read from this to see if we've received an ACK */
  public readonly ackReports$: Bacon.EventStream<AckPacket>;
  /** push to this to write commands to the stage */
  public readonly output$: Bacon.Bus<number[]>;
  /** this is everything pushed to `output$` but properly throttled/timed to the device's ack responses */
  public readonly eventsToSend$: Bacon.EventStream<number[]>;

  constructor(dev: HIDDevice) {
    // Main USB Ingestor
    const rawReport$ = Bacon.fromEvent<HIDInputReportEvent>(dev, "inputreport");

    // Panel Input State (If a panel is active or not)
    this.inputState$ = rawReport$
      .filter((e) => e.reportId === HID_REPORT_INPUT_STATE)
      .map((e) => StageInputs.decode(e.data, true));

    // All other reports (command responses)
    const report$ = rawReport$
      .filter((e) => e.reportId === HID_REPORT_INPUT)
      .map((e) => e.data)
      .filter((d) => d.byteLength !== 0)
      .withStateMachine({ currentPacket: new Uint8Array() }, collatePackets);

    this.otherReports$ = (report$.filter((e) => e.type === "data") as Bacon.EventStream<DataPacket>).map(
      (e) => e.payload,
    );
    this.ackReports$ = report$.filter((e) => e.type === "ack") as Bacon.EventStream<AckPacket>;

    const finishedCommand$ = report$
      .filter((e) => e.type === "host_cmd_finished")
      .map((e) => e.type === "host_cmd_finished");

    finishedCommand$.log("Cmd Finished");

    const okSend$ = finishedCommand$.startWith(true);

    // Main USB Output
    this.output$ = new Bacon.Bus<Array<number>>();

    // Config writes should only happen at most once per second.
    const configOutput$ = this.output$.filter((e) => e[0] === API_COMMAND.WRITE_CONFIG_V5).throttle(1000);

    // All other writes are passed through unchanged
    const otherOutput$ = this.output$.filter((e) => e[0] !== API_COMMAND.WRITE_CONFIG_V5);

    // combine together the throttled and unthrottled writes
    // and only emit one per each "ok" signal we get back following each previous output
    this.eventsToSend$ = configOutput$.merge(otherOutput$).zip(okSend$, (nextToSend) => nextToSend);
  }
}

export class SMXStage {
  private dev: HIDDevice;
  private readonly events: SMXEvents;
  private test_mode: SensorTestMode = SensorTestMode.CalibratedValues;
  private debug = true;

  info: SMXDeviceInfo | null = null;
  config: SMXConfig | null = null;
  test: SMXSensorTestData | null = null;
  inputs: Array<boolean> | null = null;

  public readonly inputState$: Bacon.EventStream<boolean[]>;
  public readonly deviceInfo$: Bacon.EventStream<SMXDeviceInfo>;
  public readonly configResponse$: Bacon.EventStream<SMXConfig | undefined>;
  public readonly testDataResponse$: Bacon.EventStream<SMXSensorTestData | undefined>;

  constructor(dev: HIDDevice) {
    this.dev = dev;
    this.events = new SMXEvents(this.dev);

    // write outgoing events to the device
    this.events.eventsToSend$.onValue(async (value) => {
      this.debug && console.log("writing to HID");
      await send_data(this.dev, value, this.debug);
    });

    // Set the device info handler
    this.deviceInfo$ = this.events.otherReports$
      .filter((e) => e[0] === char2byte("I")) // We send 'i' but for some reason we get back 'I'
      .map((value) => this.handleDeviceInfo(value));
    // note that the above map function only runs when there are listeners
    // subscribed to `this.deviceInfo$`, otherwise nothing happens!

    // Set the config request handler
    this.configResponse$ = this.events.otherReports$
      .filter((e) => e[0] === API_COMMAND.GET_CONFIG_V5)
      .map((value) => this.handleConfig(value));
    // note that the above map function only runs when there are listeners
    // subscribed to `this.configResponse$`, otherwise nothing happens!

    // Set the test data request handler
    this.testDataResponse$ = this.events.otherReports$
      .filter((e) => e[0] === API_COMMAND.GET_SENSOR_TEST_DATA)
      .map((value) => this.handleTestData(value));
    // note that the above map function only runs when there are listeners
    // subscribed to `this.testDataResponse$`, otherwise nothing happens!

    // Set the inputs data request handler
    this.inputState$ = this.events.inputState$.map((value) => this.handleInputs(value));
  }

  async init(): Promise<SMXSensorTestData | undefined> {
    // Request the device information
    return this.updateDeviceInfo().then(() => {
      // Requesting the correct config requires having the device info first
      return this.updateConfig()?.then(() => {
        // Requesting some initial test data requires we have the config first
        // so that we know how to interpret the data
        return this.updateTestData();
      });
    });
  }

  /**
   * TODO: To Implement:

   * Stretch Goal:
   * SET_PANEL_TEST_MODE
   *
   * Double Stretch Goal:
   * GET_CONFIG (old firmware)
   * WRITE_CONFIG (old_firmware)
   * SET_SERIAL_NUMBERS
   */

  writeConfig(): Promise<AckPacket | undefined> {
    if (!this.info || !this.config) return Promise.resolve(undefined);

    const command = this.info.firmware_version < 5 ? API_COMMAND.WRITE_CONFIG : API_COMMAND.WRITE_CONFIG_V5;
    const encoded_config = this.config.encode();
    this.events.output$.push([command, encoded_config.length].concat(encoded_config));

    return this.events.ackReports$.firstToPromise();
  }

  setLightStrip(color: RGB): Promise<AckPacket | undefined> {
    if (!this.info) return Promise.resolve(undefined);

    const led_strip_index = 0; // Always 0
    const number_of_leds = 44; // Always 44 (Unless some older or newer versions have more/less?)
    const rgb = color.toArray();
    const light_command = [API_COMMAND.SET_LIGHT_STRIP, led_strip_index, number_of_leds];

    for (let i = 0; i < number_of_leds; i++) {
      light_command.push(...rgb);
    }

    console.log(light_command);
    this.events.output$.push(light_command);

    return this.events.ackReports$.firstToPromise();
  }

  factoryReset(): Promise<AckPacket | undefined> {
    if (!this.info || !this.config) return Promise.resolve(undefined);

    /**
     * Factor reset resets the platform strip color saved to the
     * configuration, but it doesn't actually apply it to the lights.
     *
     * Do this for firmware v5 and up.
     */
    if (this.info.firmware_version >= 5) {
      const color = this.config.config.platformStripColor;
      this.setLightStrip(new RGB(color.r, color.g, color.b));
    }

    this.events.output$.push([API_COMMAND.FACTORY_RESET]);
    return this.events.ackReports$.firstToPromise();
  }

  forceRecalibration(): Promise<AckPacket> {
    this.events.output$.push([API_COMMAND.FORCE_RECALIBRATION]);
    return this.events.ackReports$.firstToPromise();
  }

  updateDeviceInfo(): Promise<SMXDeviceInfo> {
    this.events.output$.push([API_COMMAND.GET_DEVICE_INFO]);
    return this.deviceInfo$.firstToPromise();
  }

  updateConfig(): Promise<SMXConfig | undefined> {
    if (!this.info) return Promise.resolve(undefined);

    const command = this.info.firmware_version < 5 ? API_COMMAND.GET_CONFIG : API_COMMAND.GET_CONFIG_V5;
    this.events.output$.push([command]);
    return this.configResponse$.firstToPromise();
  }

  updateTestData(mode: SensorTestMode | null = null): Promise<SMXSensorTestData | undefined> {
    if (!this.config) return Promise.resolve(undefined);
    if (mode) this.test_mode = mode;

    this.events.output$.push([API_COMMAND.GET_SENSOR_TEST_DATA, this.test_mode]);
    return this.testDataResponse$.firstToPromise();
  }

  private handleConfig(data: Uint8Array): SMXConfig | undefined {
    if (!this.info) return;

    /*
    // TODO: Figure out how we want to handle this? I think we can actually convert to/from the new config
    // from the old config
    if (this.info.firmware_version < 5) {
      this.config = new SMXConfigOld(Array.from(data));
    } else {
      this.config = new SMXConfig(Array.from(data));
    }
    */
    this.config = new SMXConfig(Array.from(data));

    // Right now I just want to confirm that decoding and encoding gives us back the same data
    const encoded_config = this.config.encode();
    if (encoded_config) {
      this.debug &&
        console.log("Config Encodes Correctly: ", data.slice(2, -1).toString() === encoded_config.toString());
    }
    this.debug && console.log("Got Config: ", this.config);

    return this.config;
  }

  private handleTestData(data: Uint8Array): SMXSensorTestData | undefined {
    if (!this.config) return;

    this.test = new SMXSensorTestData(Array.from(data), this.test_mode, this.config.config.flags.PlatformFlags_FSR);

    this.debug && console.log("Got Test: ", this.test);

    return this.test;
  }

  private handleDeviceInfo(data: Uint8Array): SMXDeviceInfo {
    this.info = new SMXDeviceInfo(Array.from(data));

    this.debug && console.log("Got Info: ", this.info);

    return this.info;
  }

  private handleInputs(data: Decoded<typeof StageInputs>): Array<boolean> {
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

    return this.inputs;
  }
}
