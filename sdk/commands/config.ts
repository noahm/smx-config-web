import { StructBuffer, bits, uint8_t, uint16_t, sbytes } from "@nmann/struct-buffer";
import { EnabledSensors } from "./enabled-sensors.ts";
import { Panel } from "../api.ts";
import { padData } from "../utils.ts";

export type Decoded<Struct extends { decode(...args: unknown[]): unknown }> = ReturnType<Struct["decode"]>;

/**
 * Each panel has various thresholds that are used based on
 * if it's a LoadCell or FSR panel.
 */
const packed_panel_settings_t = new StructBuffer("packed_panel_settings_t", {
  /**
   * Load Cell Thresholds
   */
  loadCellLowThreshold: uint8_t,
  loadCellHighThreshold: uint8_t,

  /**
   * Activation threshold when pressing.
   * 4 values, one for each sensor on this panel.
   */
  fsrLowThreshold: uint8_t[4],
  /**
   * Release threshold when lifting.
   * 4 values, one for each sensor on this panel.
   */
  fsrHighThreshold: uint8_t[4],

  /**
   * TODO: Not sure what these are for
   */
  combinedLowThreshold: uint16_t,
  combinedHighThreshold: uint16_t,

  /**
   * This is potentially reserved for future expansion.
   * This must be left unchanged for now.
   */
  reserved: uint16_t,
});

/**
 * Flags for Panel Config stored in a uint8_t
 */
const flags_t = bits(uint8_t, {
  /**
   * If set, panels will use the pressed animation when pressed, and stepColor
   * is ignored.  If unset, panels will be lit solid using stepColor.
   * masterVersion >= 4.  Previous versions always use stepColor.
   */
  PlatformFlags_AutoLightingUsePressedAnimations: 0,

  /**
   * If set, panels are using FSRs, otherwise Load Cells
   */
  PlatformFlags_FSR: 1,
});

/**
 * Just an RGB struct for named access
 */
const rgb_t = new StructBuffer("rbg_t", {
  r: uint8_t,
  g: uint8_t,
  b: uint8_t,
});

/**
 * The configuration for a connected controller.  This can be retrieved with SMX_GetConfig
 * and modified with SMX_SetConfig.
 *
 * The order and packing of this struct corresponds to the configuration packet sent to
 * the master controller, so it must not be changed.
 */
export const smx_config_t = new StructBuffer("smx_config_t", {
  /**
   * The firmware version of the master controller.  Where supported (version 2 and up), this
   * will always read back the firmware version.  This will default to 0xFF on version 1.
   *
   * We don't need this since we can read the "I" command which also reports the version, but
   * this allows panels to also know the master version.
   */
  masterVersion: uint8_t,

  /**
   * The version of this config packet.  This can be used by the firmware to know which values
   * have been filled in.  Any values not filled in will always be 0xFF, which can be tested
   * for, but that doesn't work for values where 0xFF is a valid value.  This value is unrelated
   * to the firmware version, and just indicates which fields in this packet have been set.
   * Note that we don't need to increase this any time we add a field, only when it's important
   * that we be able to tell if a field is set or not.
   *
   * Versions:
   * - 0xFF: This is a config packet from before configVersion was added.
   * - 0x00: configVersion added
   * - 0x02: panelThreshold0Low through panelThreshold8High added
   * - 0x03: debounceDelayMs added
   */
  configVersion: uint8_t,

  /**
   * Packed Flags (masterVersion >= 4)
   */
  flags: flags_t,

  /**
   * These are internal tuneables and should be left unchanged.
   */
  debounceNodelayMilliseconds: uint16_t,
  debounceDelayMilliseconds: uint16_t,
  panelDebounceMicroseconds: uint16_t,
  autoCalibrationMaxDeviation: uint8_t,
  badSensorMinimumDelaySeconds: uint8_t,
  autoCalibrationAveragesPerUpdate: uint16_t,
  autoCalibrationSamplesPerAverage: uint16_t,

  /**
   * The maximum tare value to calibrate to (except on startup).
   */
  autoCalibrationMaxTare: uint16_t,

  /**
   * Which sensors on each panel to enable. This can be used to disable sensors that
   * we know aren't populated.
   */
  enabledSensors: new EnabledSensors(),

  /**
   * How long the master controller will wait for a lights command before assuming
   * the game has gone away and resume auto-lights.
   * This is in 128ms units
   */
  autoLightsTimeout: uint8_t,

  /**
   * The color to use for each panel when auto-lighting in master mode.  This doesn't
   * apply when the pads are in autonomous lighting mode (no master), since they don't
   * store any configuration by themselves.
   *
   * These colors are scaled to the 0-170 range.
   *
   * TODO: We can unscale them to 0-255 when reading, but then we would need to scale them back
   * when writing.
   */
  stepColor: rgb_t[9],

  /**
   * The default color to set the platform (underside) LED strips to.
   * RGB values from 0-255
   */
  platformStripColor: rgb_t,

  /**
   * Which panels to enable auto-lighting for.  Disabled panels will be unlit.
   * 0x01 = panel 0, 0x02 = panel 1, 0x04 = panel 2, etc.  This only affects
   * the master controller's built-in auto lighting and not lights data sent
   * from the SDK.
   */
  autoLightPanelMask: uint16_t, // TODO: This could probably easily be made a bit mask object

  /**
   * The rotation of the panel, where 0 is the standard rotation, 1 means the panel is
   * rotated right 90 degrees, 2 is rotated 180 degrees, and 3 is rotated 270 degrees.
   * This value is unused.
   */
  panelRotation: uint8_t,

  /**
   * Per Panel Sensor Settings
   *
   * Panel thresholds are labelled by their numpad position, eg. Panel8 is up.
   * If m_iFirmwareVersion is 1, Panel7 corresponds to all of up, down, left and
   * right, and Panel2 corresponds to UpLeft, UpRight, DownLeft and DownRight.  For
   * later firmware versions, each panel is configured independently.
   *
   * // TODO: We need to determine how far back in firmware versions we want to support
   *
   * Setting a value to 0xFF disables that threshold.
   */
  panelSettings: packed_panel_settings_t[9],

  /**
   * This is an internal tunable and should be left unchanged.
   */
  preDetailsDelayMilliseconds: uint8_t,

  /**
   * Pad the struct to 250 bytes. This keeps this struct size from changing as we add fields,
   * so the ABI doesn't change.
   *
   * Applications should leave any data in here unchanged when setting the Config.
   */
  padding: uint8_t[49],
});

const NEW_CONFIG_INIT = [
  // masterVersion : 255
  "FF",
  // configVersion : 5
  "05",
  // flags : 0
  "00",
  // debounceNodelayMilliseconds : 0
  "0000",
  // debounceDelayMilliseconds : 0
  "0000",
  // panelDebounceMicroseconds : 4000
  "0FA0",
  // autoCalibrationMaxDeviation : 100
  "64",
  // badSensorMinimumDelaySeconds : 15
  "0F",
  // autoCalibrationAveragesPerUpdate : 60
  "003C",
  // autoCalibrationSamplesPerAverage : 500
  "01F4",
  // autoCalibrationMaxTare : 65535
  "FFFF",
  // enabledSensors
  "00".repeat(5),
  // autoLightsTimeout : 1000 / 128 (1 second)
  "07",
  // stepColor
  "00".repeat(3 * 9), // 27
  // platformStripColor
  "00".repeat(3),
  // autoLightPanelMask : 65535
  "FFFF",
  // panelRotation
  "00",
  // packedSensorSettings
  "00".repeat(16 * 9), // 144
  // preDetailsDelayMilliseconds : 5
  "05",
  // padding
  "00".repeat(49),
];

const smx_old_config_t = new StructBuffer("smx_old_config_t", {
  unused1: uint8_t[6],

  masterDebounceMilliseconds: uint16_t,

  // was "cardinal"
  panelThreshold7Low: uint8_t,
  panelThreshold7High: uint8_t,

  // was "center"
  panelThreshold4Low: uint8_t,
  panelThreshold4High: uint8_t,

  // was "corner"
  panelThreshold2Low: uint8_t,
  panelThreshold2High: uint8_t,

  panelDebounceMicroseconds: uint16_t,
  autoCalibrationPeriodMilliseconds: uint16_t,
  autoCalibrationMaxDeviation: uint8_t,
  badSensorMinimumDelaySeconds: uint8_t,
  autoCalibrationAveragesPerUpdate: uint16_t,

  unused2: uint8_t[2],

  // was "up"
  panelThreshold1Low: uint8_t,
  panelThreshold1High: uint8_t,

  enabledSensors: new EnabledSensors(),

  autoLightsTimeout: uint8_t,

  stepColor: rgb_t[9],

  panelRotation: uint8_t,

  autoCalibrationSamplesPerAverage: uint16_t,

  masterVersion: uint8_t,
  configVersion: uint8_t,

  unused3: uint8_t[10],

  panelThreshold0Low: uint8_t,
  panelThreshold0High: uint8_t,
  panelThreshold3Low: uint8_t,
  panelThreshold3High: uint8_t,
  panelThreshold5Low: uint8_t,
  panelThreshold5High: uint8_t,
  panelThreshold6Low: uint8_t,
  panelThreshold6High: uint8_t,
  panelThreshold8Low: uint8_t,
  panelThreshold8High: uint8_t,

  debounceDelayMilliseconds: uint16_t,

  padding: uint8_t[164],
});

const OLD_CONFIG_INIT = [
  // unused
  "FF".repeat(6),
  // masterDebounceMilliseconds
  "0000",
  // panelThreshold{7/4/2}{Low/High}
  "FF FF FF FF FF FF",
  // panelDebounceMicroseconds : 4000
  "0FA0",
  // autoCalibrationPeriodMilliseconds : 1000
  "03E8",
  // autoCalibrationMaxDeviation : 100
  "64",
  // badSensorMinimumDelaySeconds : 15
  "0F",
  // autoCalibrationAveragesPerUpdate : 60
  "003C",
  // unused
  "FFFF",
  // panelThreshold1{Low/High}
  "FF FF",
  // enabledSensors
  "00".repeat(5),
  // autoLightsTimeout : 1000 / 128 (1 second)
  "07",
  // StepColor
  "00".repeat(3 * 9),
  // panelRotation
  "00",
  // autoCalibrationSamplesPerAverage : 500
  "01F4",
  // masterVersion
  "FF",
  // configVersion : 3
  "03",
  // unused
  "FF".repeat(10),
  // panelThreshold{0/3/5/6/8}{Low/High}
  "FF FF FF FF FF FF FF FF FF FF",
  // debounceDelayMilliseconds : 0
  "0000",
  // padding
  "00".repeat(164),
];

/**
 * The configuration for a connected SMX Stage.
 */
export class SMXConfig {
  public config: Decoded<typeof smx_config_t>;
  private oldConfig: Decoded<typeof smx_old_config_t> | null = null;
  /**
   * some much older pads send smaller sized config data, so we need
   * to keep track of how much they sent us and send back an appropriate
   * sized config in the other direction
   */
  private oldConfigSize: number | null = null;
  private firmwareVersion: number;

  /**
   * Take in the data array and decode it into this.
   */
  constructor(data: Uint8Array, firmwareVersion: number) {
    this.firmwareVersion = firmwareVersion;
    console.debug("CONFIG RAW DATA: ", data.toString());

    if (this.firmwareVersion >= 5) {
      this.config = smx_config_t.decode(data.slice(2, -1), true);
    } else {
      this.oldConfigSize = data[1];
      console.debug("Reading Old Config");

      const slicedData = data.slice(2, -1);
      // handle very old stage's smaller config data by padding
      // it out to the full size of the `smx_old_config_t` struct
      const paddedData = padData(slicedData, smx_old_config_t.byteLength);
      this.oldConfig = smx_old_config_t.decode(paddedData, true);
      this.config = this.convertOldToNew(this.oldConfig);
    }
  }

  encode(): Uint8Array {
    if (this.firmwareVersion >= 5) {
      return new Uint8Array(smx_config_t.encode(this.config, true).buffer);
    }

    if (!this.oldConfig) throw new ReferenceError("Can not encode old config as it is null");
    console.log("Writing Old Config");
    this.convertNewToOld();

    const encodedConfig = smx_old_config_t.encode(this.oldConfig, true);
    // If the old config data is less than 128 Bytes, only send the first 128 bytes
    if (this.oldConfigSize && this.oldConfigSize <= 128) {
      return new Uint8Array(encodedConfig.buffer.slice(0, 128));
    }

    return new Uint8Array(encodedConfig.buffer);
  }

  /**
   * Before encoding the config to send back to an old SMX stage,
   * we need to copy data from the new config object back into the old config object.
   *
   * We don't need to check configVersion here since it's safe to set all fields in the
   * oldConfig even if the stage doesn't use them.
   */
  private convertNewToOld() {
    if (!this.oldConfig) throw new ReferenceError("Can not convert new config to old as oldConfig is null");

    const newConfig = this.config;
    const oldConfig = this.oldConfig;

    oldConfig.masterDebounceMilliseconds = newConfig.debounceNodelayMilliseconds;

    // was "cardinal"
    oldConfig.panelThreshold7Low = newConfig.panelSettings[Panel.Down].loadCellLowThreshold;
    oldConfig.panelThreshold7High = newConfig.panelSettings[Panel.Down].loadCellHighThreshold;

    // was "center"
    oldConfig.panelThreshold4Low = newConfig.panelSettings[Panel.Center].loadCellLowThreshold;
    oldConfig.panelThreshold4High = newConfig.panelSettings[Panel.Center].loadCellHighThreshold;

    // was "corner"
    oldConfig.panelThreshold2Low = newConfig.panelSettings[Panel.UpRight].loadCellLowThreshold;
    oldConfig.panelThreshold2High = newConfig.panelSettings[Panel.UpRight].loadCellHighThreshold;

    oldConfig.panelDebounceMicroseconds = newConfig.panelDebounceMicroseconds;
    oldConfig.autoCalibrationMaxDeviation = newConfig.autoCalibrationMaxDeviation;
    oldConfig.badSensorMinimumDelaySeconds = newConfig.badSensorMinimumDelaySeconds;
    oldConfig.autoCalibrationAveragesPerUpdate = newConfig.autoCalibrationAveragesPerUpdate;

    // was "up"
    oldConfig.panelThreshold1Low = newConfig.panelSettings[Panel.Up].loadCellLowThreshold;
    oldConfig.panelThreshold1High = newConfig.panelSettings[Panel.Up].loadCellHighThreshold;

    oldConfig.enabledSensors = newConfig.enabledSensors;
    oldConfig.autoLightsTimeout = newConfig.autoLightsTimeout;
    oldConfig.stepColor = newConfig.stepColor;
    oldConfig.panelRotation = newConfig.panelRotation;
    oldConfig.autoCalibrationSamplesPerAverage = newConfig.autoCalibrationSamplesPerAverage;

    oldConfig.masterVersion = newConfig.masterVersion;
    oldConfig.configVersion = newConfig.configVersion;

    oldConfig.panelThreshold0Low = newConfig.panelSettings[Panel.UpLeft].loadCellLowThreshold;
    oldConfig.panelThreshold0High = newConfig.panelSettings[Panel.UpLeft].loadCellHighThreshold;

    oldConfig.panelThreshold3Low = newConfig.panelSettings[Panel.Left].loadCellLowThreshold;
    oldConfig.panelThreshold3High = newConfig.panelSettings[Panel.Left].loadCellHighThreshold;

    oldConfig.panelThreshold5Low = newConfig.panelSettings[Panel.Right].loadCellLowThreshold;
    oldConfig.panelThreshold5High = newConfig.panelSettings[Panel.Right].loadCellHighThreshold;

    oldConfig.panelThreshold6Low = newConfig.panelSettings[Panel.DownLeft].loadCellLowThreshold;
    oldConfig.panelThreshold6High = newConfig.panelSettings[Panel.DownLeft].loadCellHighThreshold;

    oldConfig.panelThreshold8Low = newConfig.panelSettings[Panel.DownRight].loadCellLowThreshold;
    oldConfig.panelThreshold8High = newConfig.panelSettings[Panel.DownRight].loadCellHighThreshold;

    oldConfig.debounceDelayMilliseconds = newConfig.debounceDelayMilliseconds;
  }

  /**
   * Given a parsed old config object, initiate a new config object
   * and replace the necessary values from the old config.
   *
   * Depending on the old configs configVersion, we may exit early as earlier versiond of configs
   * didn't have certain fields set.
   *
   * We return the config object so that the constructor has a definitive `this.config` assignment.
   *
   * @param oldConfig Decoded smx_old_config_t object
   * @returns A new config object built from old config data
   */
  private convertOldToNew(oldConfig: Decoded<typeof smx_old_config_t>): Decoded<typeof smx_config_t> {
    console.log("old config: ", oldConfig);
    const newConfig = smx_config_t.decode(sbytes(NEW_CONFIG_INIT.join("")), false);

    newConfig.debounceNodelayMilliseconds = oldConfig.masterDebounceMilliseconds;

    // was "cardinal"
    newConfig.panelSettings[Panel.Down].loadCellLowThreshold = oldConfig.panelThreshold7Low;
    newConfig.panelSettings[Panel.Down].loadCellHighThreshold = oldConfig.panelThreshold7High;

    // was "center"
    newConfig.panelSettings[Panel.Center].loadCellLowThreshold = oldConfig.panelThreshold4Low;
    newConfig.panelSettings[Panel.Center].loadCellHighThreshold = oldConfig.panelThreshold4High;

    // was "corner"
    newConfig.panelSettings[Panel.UpRight].loadCellLowThreshold = oldConfig.panelThreshold2Low;
    newConfig.panelSettings[Panel.UpRight].loadCellHighThreshold = oldConfig.panelThreshold2High;

    newConfig.panelDebounceMicroseconds = oldConfig.panelDebounceMicroseconds;
    newConfig.autoCalibrationMaxDeviation = oldConfig.autoCalibrationMaxDeviation;
    newConfig.badSensorMinimumDelaySeconds = oldConfig.badSensorMinimumDelaySeconds;
    newConfig.autoCalibrationAveragesPerUpdate = oldConfig.autoCalibrationAveragesPerUpdate;

    // was "up"
    newConfig.panelSettings[Panel.Up].loadCellLowThreshold = oldConfig.panelThreshold1Low;
    newConfig.panelSettings[Panel.Up].loadCellHighThreshold = oldConfig.panelThreshold1High;

    newConfig.enabledSensors = oldConfig.enabledSensors;
    newConfig.autoLightsTimeout = oldConfig.autoLightsTimeout;
    newConfig.stepColor = oldConfig.stepColor;
    newConfig.panelRotation = oldConfig.panelRotation;
    newConfig.autoCalibrationSamplesPerAverage = oldConfig.autoCalibrationSamplesPerAverage;

    if (oldConfig.configVersion === 0xff) return newConfig;

    newConfig.masterVersion = oldConfig.masterVersion;
    newConfig.configVersion = oldConfig.configVersion;

    if (oldConfig.configVersion < 2) return newConfig;

    newConfig.panelSettings[Panel.UpLeft].loadCellLowThreshold = oldConfig.panelThreshold0Low;
    newConfig.panelSettings[Panel.UpLeft].loadCellHighThreshold = oldConfig.panelThreshold0High;

    newConfig.panelSettings[Panel.Left].loadCellLowThreshold = oldConfig.panelThreshold3Low;
    newConfig.panelSettings[Panel.Left].loadCellHighThreshold = oldConfig.panelThreshold3High;

    newConfig.panelSettings[Panel.Right].loadCellLowThreshold = oldConfig.panelThreshold5Low;
    newConfig.panelSettings[Panel.Right].loadCellHighThreshold = oldConfig.panelThreshold5High;

    newConfig.panelSettings[Panel.DownLeft].loadCellLowThreshold = oldConfig.panelThreshold6Low;
    newConfig.panelSettings[Panel.DownLeft].loadCellHighThreshold = oldConfig.panelThreshold6High;

    newConfig.panelSettings[Panel.DownRight].loadCellLowThreshold = oldConfig.panelThreshold8Low;
    newConfig.panelSettings[Panel.DownRight].loadCellHighThreshold = oldConfig.panelThreshold8High;
    if (oldConfig.configVersion < 3) return newConfig;

    newConfig.debounceDelayMilliseconds = oldConfig.debounceDelayMilliseconds;

    return newConfig;
  }
}
