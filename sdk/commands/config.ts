import { StructBuffer, bits, uint8_t, uint16_t } from "@nmann/struct-buffer";
import { EnabledSensors } from "./enabled-sensors.ts";

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
   * FSR Thresholds
   * 4 Sensors per threshold
   */
  fsrLowThreshold: uint8_t[4],
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

/**
 * The configuration for a connected SMX Stage.
 */
export class SMXConfig {
  public config: Decoded<typeof smx_config_t>;

  /**
   * Take in the data array and decode it into this.
   */
  constructor(data: Array<number>) {
    this.config = smx_config_t.decode(data.slice(2, -1), true);
  }

  /**
   * TODO: Make this private again later, and maybe make a function called
   * "write_to_stage" or something? Depends on how we want to handle writing/reading
   */
  encode(): Array<number> {
    return Array.from(new Uint8Array(smx_config_t.encode(this.config, true).buffer));
  }
}
