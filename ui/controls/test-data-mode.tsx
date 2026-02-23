import { Form, Select } from "antd";
import { useAtomValue, useAtom } from "jotai";
import { selectedStage$, displayTestData$ } from "../state";

export function TestDataMode() {
  const stage = useAtomValue(selectedStage$);
  const [testMode, setTestMode] = useAtom(displayTestData$);

  return (
    <Form.Item label="Display Sensor Values:">
      <Select
        disabled={!stage}
        value={testMode}
        options={[
          { value: "", label: "None" },
          { value: "raw", label: "Raw" },
          { value: "calibrated", label: "Calibrated" },
          // ["noise", "Noise"],
          // ["tare", "Tare"],
        ]}
        onChange={(next) => setTestMode(next)}
      />
    </Form.Item>
  );
}
