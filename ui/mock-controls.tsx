import { useAtom } from "jotai";
import { activeLeftStage$, activeRightStage$ } from "./state";
import { Group, SegmentedControl } from "@mantine/core";
import { StageMock } from "../sdk/mock";

export default function MockStageControls() {
  const [leftStage, setLeftStage] = useAtom(activeLeftStage$);
  const [rightStage, setRightStage] = useAtom(activeRightStage$);
  let value = 0;
  if (leftStage && rightStage) {
    value = 3;
  } else if (leftStage) {
    value = 1;
  } else if (rightStage) {
    value = 2;
  }
  return (
    <Group gap="xs">
      Mock stages:
      <SegmentedControl
        value={value}
        onChange={(next) => {
          switch (next) {
            case 0:
              setLeftStage(null);
              setRightStage(null);
              break;
            case 1:
              leftStage || setLeftStage(new StageMock(1));
              setRightStage(null);
              break;
            case 2:
              setLeftStage(null);
              rightStage || setRightStage(new StageMock(2));
              break;
            case 3:
              leftStage || setLeftStage(new StageMock(1));
              rightStage || setRightStage(new StageMock(2));
              break;
          }
        }}
        data={[
          { label: "None", value: 0 },
          { label: "P1", value: 1 },
          { label: "P2", value: 2 },
          { label: "Both", value: 3 },
        ]}
      />
    </Group>
  );
}
