import { useAtom } from "jotai";
import { activeLeftStage$, activeRightStage$ } from "./state";
import { Stack, Button, Group } from "@mantine/core";
import { FsrStageMock, LoadCellStageMock } from "../sdk/mock";
import type { StageLike } from "../sdk/interface";

export default function MockStageControls() {
  const [leftStage, setLeftStage] = useAtom(activeLeftStage$);
  const [rightStage, setRightStage] = useAtom(activeRightStage$);
  if (leftStage && rightStage) {
    return null;
  }
  return (
    <Stack gap="xs" style={{ position: "absolute", left: 15, top: 15 }}>
      {!leftStage && (
        <Group gap="xs">
          Mock P1 as <AddStageBtns setStage={setLeftStage} />
        </Group>
      )}
      {!rightStage && (
        <Group gap="xs">
          Mock P2 as <AddStageBtns setStage={setRightStage} />
        </Group>
      )}
    </Stack>
  );
}

function AddStageBtns(props: { setStage(s: StageLike): void }) {
  return (
    <>
      <Button variant="default" onClick={() => props.setStage(new FsrStageMock(1))}>
        FSR
      </Button>
      <Button variant="default" onClick={() => props.setStage(new LoadCellStageMock(1))}>
        Load Cell
      </Button>
    </>
  );
}
