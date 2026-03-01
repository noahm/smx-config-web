import { Group } from "@mantine/core";
import { activeLeftStageSerial$, activeRightStageSerial$ } from "./state.ts";
import { Stage } from "./stage";
import { useAtomValue } from "jotai";
import { PairAStage } from "./stage/pair-a-stage.tsx";

export function StagePair() {
  const leftStage = useAtomValue(activeLeftStageSerial$);
  const rightStage = useAtomValue(activeRightStageSerial$);

  if (!leftStage && !rightStage) {
    return <PairAStage />;
  }

  return (
    <Group>
      <Stage stageSerialAtom={activeLeftStageSerial$} />
      <Stage stageSerialAtom={activeRightStageSerial$} />
    </Group>
  );
}
