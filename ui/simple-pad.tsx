import { useCallback, useEffect, useState } from "react";
import { StageInputs } from "../sdk/commands/inputs";
import { HID_REPORT_INPUT_STATE } from "../sdk/packet";

interface Props {
  dev: HIDDevice;
}

export function SimplePad({ dev }: Props) {
  const [panelStates, setPanelStates] = useState<number[]>([]);

  const handleInputReport = useCallback((ev: HIDInputReportEvent) => {
    if (ev.reportId === HID_REPORT_INPUT_STATE) {
      const panelStates = StageInputs.decode(ev.data, true);
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
    }
  }, []);

  useEffect(() => {
    dev.addEventListener("inputreport", handleInputReport);
    return () => dev.removeEventListener("inputreport", handleInputReport);
  }, [handleInputReport, dev]);

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
