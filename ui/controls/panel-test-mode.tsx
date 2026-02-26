import { Switch } from "@mantine/core";
import { useAtomValue } from "jotai";
import { PanelTestMode } from "../../sdk/api";
import { selectedStage$ } from "../state";

export function PanelTestModeToggle() {
  const stage = useAtomValue(selectedStage$);

  return (
    <Switch
      label="Panel Test Mode"
      disabled={!stage}
      defaultChecked={stage?.getPanelTestMode() === PanelTestMode.PressureTest}
      onChange={(v) => {
        stage?.setPanelTestMode(v ? PanelTestMode.PressureTest : PanelTestMode.Off);
      }}
    />
  );
}
