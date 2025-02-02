import { useAtomValue, type Atom } from "jotai";
import type { SMXStage } from "../../sdk";
import { useConfig } from "./hooks";

export function ConfigValues(props: { stageAtom: Atom<SMXStage | undefined> }) {
  const stage = useAtomValue(props.stageAtom);
  const config = useConfig(stage);

  const ranges = config?.enabledSensors.flatMap((panel, idx) => {
    if (!panel.some((sensor) => sensor)) {
      return []; // skip panels will all disabled sensors
    }

    const { fsrHighThreshold: highs, fsrLowThreshold: lows } = config.panelSettings[idx];

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
    <>
      <h3>Sensitivity settings</h3>
      <ul>
        {ranges.map((range) => (
          <li key={range.idx}>
            Panel {range.idx + 1}: {range.lows[0]} - {range.highs[0]}
          </li>
        ))}
      </ul>
    </>
  );
}
