import { SegmentedControl, Group } from "@mantine/core";
import { useAtomValue, useAtom } from "jotai";
import { hasActiveStage$, displayTestData$ } from "../state";

export function TestDataMode() {
  const stage = useAtomValue(hasActiveStage$);
  const [testMode, setTestMode] = useAtom(displayTestData$);

  return (
    <Group gap="xs">
      Display sensor values:
      <SegmentedControl
        disabled={!stage}
        value={testMode}
        data={[
          { value: "", label: "None" },
          { value: "raw", label: "Raw" },
          { value: "calibrated", label: "Calibrated" },
          // ["noise", "Noise"],
          // ["tare", "Tare"],
        ]}
        onChange={(value) => setTestMode(value)}
      />
    </Group>
  );
}
