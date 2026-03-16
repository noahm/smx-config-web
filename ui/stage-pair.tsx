import { Group } from "@mantine/core";
import { activeLeftStage$, activeRightStage$ } from "./state.ts";
import { Stage } from "./stage";
import { useAtom } from "jotai";
import { PairAStage } from "./stage/pair-a-stage.tsx";
import { PairAnother } from "./stage/pair-another.tsx";
import { ErrorBoundary } from "react-error-boundary";
import { ErroredStage } from "./stage/errored-stage.tsx";

export function StagePair() {
  const [leftStage, setLeftStage] = useAtom(activeLeftStage$);
  const [rightStage, setRightStage] = useAtom(activeRightStage$);

  if (!leftStage && !rightStage) {
    return <PairAStage />;
  }

  const closeLeftStage = () => {
    leftStage?.close();
    setLeftStage(null);
  };
  const closeRightStage = () => {
    rightStage?.close();
    setRightStage(null);
  };

  if (!rightStage || !leftStage) {
    return (
      <Group wrap="nowrap">
        <PairAnother side="left" />
        <Stage stage={leftStage || rightStage} pos="right" onClose={leftStage ? closeLeftStage : closeRightStage} />
      </Group>
    );
  }

  return (
    <Group wrap="nowrap" gap={0}>
      <ErrorBoundary FallbackComponent={ErroredStage}>
        <Stage stage={leftStage} pos="left" onClose={closeLeftStage} />
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={ErroredStage}>
        <Stage stage={rightStage} pos="right" onClose={closeRightStage} />
      </ErrorBoundary>
    </Group>
  );
}
