import { Group } from "@mantine/core";
import { activeLeftStage$, activeRightStage$ } from "./state.ts";
import { Stage } from "./stage";
import { useAtomValue } from "jotai";
import { PairAStage } from "./stage/pair-a-stage.tsx";

export function StagePair() {
  const leftStage = useAtomValue(activeLeftStage$);
  const rightStage = useAtomValue(activeRightStage$);

  if (!leftStage && !rightStage) {
    return <PairAStage />;
  }

  return (
    <Group>
      <Stage stage={leftStage} />
      <Stage stage={rightStage} />
    </Group>
  );
}
