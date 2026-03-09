import { Group } from "@mantine/core";
import { activeLeftStage$, activeRightStage$ } from "./state.ts";
import { Stage } from "./stage";
import { useAtomValue } from "jotai";
import { PairAStage } from "./stage/pair-a-stage.tsx";
import { PairAnother } from "./stage/pair-another.tsx";

export function StagePair() {
  const leftStage = useAtomValue(activeLeftStage$);
  const rightStage = useAtomValue(activeRightStage$);

  if (!leftStage && !rightStage) {
    return <PairAStage />;
  }

  if (!rightStage || !leftStage) {
    return (
      <Group wrap="nowrap">
        <PairAnother side="left" />
        <Stage stage={leftStage || rightStage} pos="right" />
      </Group>
    );
  }

  return (
    <Group wrap="nowrap" gap={0}>
      <Stage stage={leftStage} pos="left" />
      <Stage stage={rightStage} pos="right" />
    </Group>
  );
}
