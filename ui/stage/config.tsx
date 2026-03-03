import type { StageLike } from "../../sdk/interface";
import { useConfig } from "./hooks";
import { Fieldset } from "@mantine/core";

export function ConfigValues(props: { stage: StageLike }) {
  const config = useConfig(props.stage);

  const ranges = config?.enabledSensors.flatMap((panel, idx) => {
    if (!panel.some((sensor) => sensor)) {
      return []; // skip panels will all disabled sensors
    }
    let highs: number[];
    let lows: number[];
    if (config.flags.PlatformFlags_FSR) {
      // TODO: break this down when some sensors have different values
      highs = config.panelSettings[idx].fsrHighThreshold;
      lows = config.panelSettings[idx].fsrLowThreshold;
    } else {
      const { loadCellHighThreshold, loadCellLowThreshold } = config.panelSettings[idx];
      highs = new Array<number>(4).fill(loadCellHighThreshold);
      lows = new Array<number>(4).fill(loadCellLowThreshold);
    }
    return {
      idx,
      lows,
      highs,
    };
  });

  if (!ranges) {
    return null;
  }

  return (
    <Fieldset legend="Current settings">
      <ul>
        {ranges.map((range) => (
          <li key={range.idx}>
            Panel {range.idx + 1}: {range.lows[0]} - {range.highs[0]}
          </li>
        ))}
      </ul>
    </Fieldset>
  );
}
