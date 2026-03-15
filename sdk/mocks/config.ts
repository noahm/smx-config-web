import type { ConfigShape } from "../commands/config";

const panelSettingNormal: ConfigShape["panelSettings"][0] = {
  combinedHighThreshold: 180,
  combinedLowThreshold: 179,
  loadCellHighThreshold: 50,
  loadCellLowThreshold: 35,
  fsrHighThreshold: [180, 180, 180, 180],
  fsrLowThreshold: [179, 179, 179, 179],
  reserved: 0,
};

export const fsrConfig: ConfigShape = {
  autoCalibrationAveragesPerUpdate: 0,
  autoCalibrationMaxDeviation: 0,
  autoCalibrationMaxTare: 0,
  autoCalibrationSamplesPerAverage: 0,
  autoLightPanelMask: 0,
  autoLightsTimeout: 0,
  badSensorMinimumDelaySeconds: 0,
  configVersion: 0x03,
  debounceDelayMilliseconds: 5,
  debounceNodelayMilliseconds: 5,
  enabledSensors: [
    [false, false, false, false],
    [true, true, true, true],
    [false, false, false, false],
    [true, true, true, true],
    [true, true, true, true],
    [true, true, true, true],
    [false, false, false, false],
    [true, true, true, true],
    [false, false, false, false],
  ],
  flags: {
    PlatformFlags_AutoLightingUsePressedAnimations: true,
    PlatformFlags_FSR: true,
  },
  masterVersion: 5,
  padding: [],
  panelDebounceMicroseconds: 0,
  panelRotation: 0,
  panelSettings: [
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
    panelSettingNormal,
  ],
  platformStripColor: {
    b: 255,
    g: 0,
    r: 0,
  },
  preDetailsDelayMilliseconds: 0,
  stepColor: [
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
    {
      b: 170,
      g: 170,
      r: 170,
    },
  ],
};
