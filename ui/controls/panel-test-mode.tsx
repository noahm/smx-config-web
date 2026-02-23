import { Form, Switch } from "antd";
import { useAtomValue } from "jotai";
import { PanelTestMode } from "../../sdk/api";
import { selectedStage$ } from "../state";

export function PanelTestModeToggle() {
  const stage = useAtomValue(selectedStage$);

  return (
    <Form.Item label="Panel Test Mode">
      <Switch
        disabled={!stage}
        defaultChecked={stage?.getPanelTestMode() === PanelTestMode.PressureTest}
        onChange={(v) => {
          stage?.setPanelTestMode(v ? PanelTestMode.PressureTest : PanelTestMode.Off);
        }}
      />
    </Form.Item>
  );
}
