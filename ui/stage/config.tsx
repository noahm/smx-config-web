import type { StageLike } from "../../sdk/interface";
import { useConfig } from "./hooks";
import { Fieldset } from "@mantine/core";
import { sensitivityLevelsForPanel } from "./util";

export function ConfigValues(props: { stage: StageLike }) {
  const config = useConfig(props.stage);

  const ranges = config?.enabledSensors.flatMap((panel, idx) => {
    if (!panel.some((sensor) => sensor)) {
      return []; // skip panels will all disabled sensors
    }
    return {
      idx,
      ...sensitivityLevelsForPanel(config, idx),
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
