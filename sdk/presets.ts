import type { SMXStage } from "./smx";

export type SensitivityThreshold = readonly [release: number, activate: number];

export interface SensitivityPreset {
  readonly fsr: SensitivityThreshold;
  readonly loadCell: SensitivityThreshold;
  readonly fsrCenter?: SensitivityThreshold;
  readonly loadCellCenter?: SensitivityThreshold;
}

/**
 * @see https://github.com/steprevolution/stepmaniax-sdk/blob/master/smx-config/ConfigPresets.cs#L95-L114
 */
const presets = {
  high: {
    loadCell: [20, 25],
    fsr: [152, 153],
  } as SensitivityPreset,
  normal: {
    loadCell: [33, 42],
    loadCellCenter: [35, 60],
    fsr: [174, 175],
    fsrCenter: [199, 200],
  } as SensitivityPreset,
  low: {
    loadCell: [70, 80],
    loadCellCenter: [100, 120],
    fsr: [217, 218],
  } as SensitivityPreset,
};

/**
 * Apply sensitivity presets to all sensors on a stage and writes config back to the stage.
 * @param stage
 * @param presetKey a string of high/normal/low or a custom sensitivity profile
 */
export async function applySensitivityPreset(stage: SMXStage, presetKey: SensitivityPreset | keyof typeof presets) {
  const config = stage.config;
  if (!config) throw new Error("Config not available");
  const preset = typeof presetKey === "string" ? presets[presetKey] : presetKey;
  config.panelSettings.forEach((panel, idx) => {
    const loadCellThresholds =
      idx === 4 && preset.loadCellCenter ? preset.loadCellCenter || preset.loadCell : preset.loadCell;
    panel.loadCellHighThreshold = loadCellThresholds[1];
    panel.loadCellLowThreshold = loadCellThresholds[0];
    const fsrThresholds = idx === 4 && preset.fsrCenter ? preset.fsrCenter || preset.fsr : preset.fsr;
    for (let i = 0; i <= 3; i++) {
      panel.fsrHighThreshold[i] = fsrThresholds[1];
      panel.fsrLowThreshold[i] = fsrThresholds[0];
    }
  });
  await stage.writeConfig();
}
