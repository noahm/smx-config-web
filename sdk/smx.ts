import * as Bacon from "baconjs";
import { collatePackets, type AckPacket, type DataPacket } from "./state-machines/collate-packets";
import { API_COMMAND, PanelTestMode, char2byte } from "./api";
import { SMXConfig, type ConfigShape } from "./commands/config";
import { SMXDeviceInfo } from "./commands/data_info";
import { StageInputs } from "./commands/inputs";
import { HID_REPORT_INPUT, HID_REPORT_INPUT_STATE, send_data } from "./packet";
import { SMXSensorTestData, SensorTestMode, type SMXPanelTestData } from "./commands/sensor_test";
import { RGB, padData } from "./utils";
import type { StageLike } from "./interface";

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
  public readonly output$: Bacon.Bus<Uint8Array>;
  /** this is everything pushed to `output$` but properly throttled/timed to the device's ack responses */
  public readonly eventsToSend$: Bacon.EventStream<Uint8Array>;

  constructor(dev: HIDDevice) {
    // Main USB Ingestor
    const rawReport$ = Bacon.fromEvent<HIDInputReportEvent>(dev, "inputreport");

    // Panel Input State (If a panel is active or not)
    this.inputState$ = rawReport$
      .filter((e) => e.reportId === HID_REPORT_INPUT_STATE)
      .map((e) => StageInputs.decode(e.data, { littleEndian: true }));

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

    const finishedCommand$ = report$.filter((e) => e.type === "host_cmd_finished");

    // Main USB Output
    this.output$ = new Bacon.Bus<Uint8Array>();

    const isConfigWrite = (e: Uint8Array) => e[0] === API_COMMAND.WRITE_CONFIG || e[0] === API_COMMAND.WRITE_CONFIG_V5;

    // Config writes should only happen at most once per second.
    const configOutput$ = this.output$.filter(isConfigWrite).throttle(1000);

    // All other writes are passed through unchanged
    const otherOutput$ = this.output$.filter((e) => !isConfigWrite(e));

    const pendingOutput$ = configOutput$.merge(otherOutput$);

    // If the device doesn't respond with host_cmd_finished within 5 seconds,
    // recover by allowing the next command to be sent anyway. This prevents
    // the output pipeline from stalling permanently if a response is missed.
    const CMD_TIMEOUT_MS = 5000;
    const timeoutRecovery$ = pendingOutput$.flatMap(() =>
      Bacon.later(CMD_TIMEOUT_MS, true).takeUntil(finishedCommand$),
    );
    const okSend$ = finishedCommand$.merge(timeoutRecovery$).startWith(true);

    // combine together the throttled and unthrottled writes
    // and only emit one per each "ok" signal we get back following each previous output
    this.eventsToSend$ = pendingOutput$.zip(okSend$, (nextToSend) => nextToSend);
  }
}

// UI Update Rate in Milliseconds for sensor values
const TEST_DATA_REQUEST_RATE = 100;

export class SMXStage implements StageLike {
  private dev: HIDDevice;
  private readonly events: SMXEvents;
  private debug: boolean;
  private _config: SMXConfig | null = null;

  public get config() {
    return this._config?.config || null;
  }
  public info: SMXDeviceInfo | null = null;
  public test: SMXSensorTestData | null = null;

  public readonly inputState$: Bacon.EventStream<boolean[]>;
  private readonly deviceInfo$: Bacon.EventStream<SMXDeviceInfo>;
  public readonly configResponse$: Bacon.EventStream<ConfigShape>;
  public readonly calibratedSensorData$: Bacon.EventStream<readonly SMXPanelTestData[]>;
  public readonly rawSensorData$: Bacon.EventStream<readonly SMXPanelTestData[]>;
  public readonly sensorTareData$: Bacon.EventStream<readonly SMXPanelTestData[]>;
  public readonly engagePanelTestMode$: Bacon.EventStream<void>;

  constructor(dev: HIDDevice, debug = false) {
    this.dev = dev;
    this.debug = debug;
    this.events = new SMXEvents(this.dev);

    // write outgoing events to the device
    this.events.eventsToSend$.onValue(async (value) => {
      this.debug && console.debug("writing to HID");
      await send_data(this.dev, value, this.debug);
    });

    // Set the device info handler
    // note: the map/doAction below only run when there are listeners subscribed
    this.deviceInfo$ = this.events.otherReports$
      .filter((e) => e[0] === char2byte("I")) // We send 'i' but for some reason we get back 'I'
      .map((data) => new SMXDeviceInfo(data))
      .doAction((info) => {
        this.info = info;
        this.debug && console.debug("Got Info: ", info);
      });

    // Set the config request handler
    // note: the map/doAction below only run when there are listeners subscribed
    this.configResponse$ = this.events.otherReports$
      .filter((e) => e[0] === API_COMMAND.GET_CONFIG || e[0] === API_COMMAND.GET_CONFIG_V5)
      .map((data) => {
        // biome-ignore lint/style/noNonNullAssertion: info should very much be defined here
        this._config = new SMXConfig(data, this.info!.firmware_version);

        if (this.debug) {
          // Confirm that decoding and encoding gives us back the same data
          const encoded_config = this._config.encode();
          if (encoded_config) {
            const origData = data.slice(2, -1).toString();
            const reEncodedData = encoded_config.toString();
            const encodingMatch = origData === reEncodedData;
            console.debug("Config Encodes Correctly: ", encodingMatch);
            if (!encodingMatch) {
              console.debug("ORIGINAL:", data.slice(2, -1));
              console.debug("ENCODED CONFIG:", encoded_config);
            }
          }
          console.info("Got Config: ", this._config.config);
        }

        return this._config.config;
      });

    const sensorTestReports$ = this.events.otherReports$
      .filter((e) => e[0] === API_COMMAND.GET_SENSOR_TEST_DATA)
      .map((data) => {
        // biome-ignore lint/style/noNonNullAssertion: config should very much be defined here
        const testData = new SMXSensorTestData(data, this.config!.flags.PlatformFlags_FSR);
        this.test = testData;
        this.debug && console.debug("Got Test: ", testData);
        return testData;
      });

    const sensorTestObservable = (forType: SensorTestMode, updateRateMs: number) =>
      Bacon.fromBinder<readonly SMXPanelTestData[]>((sink) => {
        const stopInterval = Bacon.interval(updateRateMs, null).subscribe(() => {
          this.events.output$.push(Uint8Array.of(API_COMMAND.GET_SENSOR_TEST_DATA, forType));
        });
        const endMainSub = sensorTestReports$
          .filter((r) => r.mode === forType)
          .map((t) => t.panels)
          .subscribe(sink);
        return () => {
          stopInterval();
          endMainSub();
        };
      });

    this.rawSensorData$ = sensorTestObservable(SensorTestMode.UncalibratedValues, TEST_DATA_REQUEST_RATE);
    this.calibratedSensorData$ = sensorTestObservable(SensorTestMode.CalibratedValues, TEST_DATA_REQUEST_RATE);
    // slower update rate for tare values
    this.sensorTareData$ = sensorTestObservable(SensorTestMode.Tare, 5_000);

    this.engagePanelTestMode$ = Bacon.fromBinder(() => {
      /**
       * the 'l' command used to set lights, but it's now only used to turn lights off
       * for cases like this
       * 1 pad * 9 panels * 25 lights each * 3 (RGB) = 675
       * The source code uses `108` instead and I'm really unsure why,
       * but we're gonna do the same thing here because it works.
       */
      this.events.output$.push(Uint8Array.of(API_COMMAND.SET_LIGHTS_OLD, ...padData([], 108, 0), char2byte("\n")));

      // Send the Panel Test Mode command
      const setTestMode = () =>
        this.events.output$.push(
          Uint8Array.of(API_COMMAND.SET_PANEL_TEST_MODE, char2byte(" "), PanelTestMode.PressureTest, char2byte("\n")),
        );
      setTestMode();
      // The Panel Test Mode command needs to be resent approximately every second, or else the stage will
      // auto time out and turn off Panel Test Mode itself
      const cancelTestModeInterval = Bacon.interval(1000, null).subscribe(setTestMode);

      return () => {
        cancelTestModeInterval();
        this.events.output$.push(
          Uint8Array.of(API_COMMAND.SET_PANEL_TEST_MODE, char2byte(" "), PanelTestMode.Off, char2byte("\n")),
        );
      };
    });

    // Set the inputs data request handler
    this.inputState$ = this.events.inputState$.map((data) => [
      data.up_left,
      data.up,
      data.up_right,
      data.left,
      data.center,
      data.right,
      data.down_left,
      data.down,
      data.down_right,
    ]);
  }

  public async init(): Promise<void> {
    // Request the device information
    await this.updateDeviceInfo();
    // Requesting the correct config requires having the device info first
    await this.updateConfig();
  }

  /**
   * TODO: To Implement:
   *
   * SET_SERIAL_NUMBERS
   */

  private async needsInfo(): Promise<SMXDeviceInfo> {
    if (!this.info) await this.updateDeviceInfo();
    if (!this.info) throw new ReferenceError("this.info does not exist for stage.");

    return this.info;
  }

  private async needsConfig(): Promise<SMXConfig> {
    if (!this._config) await this.updateConfig();
    if (!this._config) throw new ReferenceError("this.config does not exist for stage.");

    return this._config;
  }

  // TODO: pass in the new config as an arg here instead of expecting mutation?
  public async writeConfig(): Promise<ConfigShape> {
    const info = await this.needsInfo();
    const config = await this.needsConfig();

    const command = info.firmware_version < 5 ? API_COMMAND.WRITE_CONFIG : API_COMMAND.WRITE_CONFIG_V5;
    const encoded_config = config.encode();
    this.events.output$.push(new Uint8Array([command, encoded_config.length, ...encoded_config]));

    await this.events.ackReports$.firstToPromise();
    // request a fresh config response back from the stage
    // to trigger an event on this.configResponse$ and update UI
    return this.updateConfig();
  }

  public setLightStrip(color: RGB): Promise<AckPacket> {
    const led_strip_index = 0; // Always 0
    const number_of_leds = 44; // Always 44 (Unless some older or newer versions have more/less?)
    const rgb = color.toArray();
    const light_command = [API_COMMAND.SET_LIGHT_STRIP, led_strip_index, number_of_leds];

    for (let i = 0; i < number_of_leds; i++) {
      light_command.push(...rgb);
    }

    this.events.output$.push(new Uint8Array(light_command));
    return this.events.ackReports$.firstToPromise();
  }

  public async factoryReset(): Promise<void> {
    const info = await this.needsInfo();
    const config = await this.needsConfig();

    /**
     * Factory reset resets the platform strip color saved to the
     * configuration, but it doesn't actually apply it to the lights.
     *
     * Do this for firmware v5 and up.
     */
    if (info.firmware_version >= 5) {
      const color = config.config.platformStripColor;
      this.setLightStrip(new RGB(color.r, color.g, color.b));
    }

    this.events.output$.push(Uint8Array.of(API_COMMAND.FACTORY_RESET));
    await this.events.ackReports$.firstToPromise();
  }

  public async forceRecalibrate(): Promise<void> {
    this.events.output$.push(Uint8Array.of(API_COMMAND.FORCE_RECALIBRATION));
    await this.events.ackReports$.firstToPromise();
  }

  public close() {
    this.dev.close();
  }

  private updateDeviceInfo(): Promise<SMXDeviceInfo> {
    this.events.output$.push(Uint8Array.of(API_COMMAND.GET_DEVICE_INFO));
    return this.deviceInfo$.firstToPromise();
  }

  private async updateConfig(): Promise<ConfigShape> {
    const info = await this.needsInfo();

    const command = info.firmware_version < 5 ? API_COMMAND.GET_CONFIG : API_COMMAND.GET_CONFIG_V5;
    this.events.output$.push(Uint8Array.of(command));
    return this.configResponse$.firstToPromise();
  }
}
