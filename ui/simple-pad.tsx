import { useCallback, useEffect, useState } from "react";
import { SmxStage } from "../sdk";
import { StageInputs } from "../sdk/commands/inputs.ts";
import { HID_REPORT_INPUT_STATE } from "../sdk/packet.ts";

interface Props {
  dev: HIDDevice;
}

export function SimplePad({ dev }: Props) {
  const [panelStates, setPanelStates] = useState<number[]>([]);

  useEffect(
    () =>
      SmxStage(dev)
        .inputState$.throttle(67)
        .onValue((panelStates) => {
          setPanelStates([
            panelStates.up_left,
            panelStates.up,
            panelStates.up_right,
            panelStates.left,
            panelStates.center,
            panelStates.right,
            panelStates.down_left,
            panelStates.down,
            panelStates.down_right,
          ]);
        }),
    [dev],
  );

  return (
    <div className="pad">
      {panelStates.map((pressed, idx) => {
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: there's literally just 9 panels...
            key={`panel-${idx}`}
            className={`panel ${pressed ? "active" : ""}`}
          />
        );
      })}
    </div>
  );
}
