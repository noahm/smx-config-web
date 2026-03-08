import { Switch } from "@mantine/core";
import { PanelTestMode } from "../../sdk/api";
import { useStage } from "../context";

export function PanelTestModeToggle() {
  const stage = useStage();

  return (
    <Switch
      label="Panel Test Mode"
      disabled={!stage}
      defaultChecked={stage?.panelTestMode === PanelTestMode.PressureTest}
      onChange={(v) => {
        stage?.setPanelTestMode(v ? PanelTestMode.PressureTest : PanelTestMode.Off);
      }}
    />
  );
}
