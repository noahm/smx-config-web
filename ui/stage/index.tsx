import { StageContextProvider } from "../context";
import { StageLayout } from "./stage-layout";
import { Group, Stack } from "@mantine/core";
import { ConfigValues } from "./config";
import type { StageLike } from "../../sdk/interface";

export function Stage({ stage, pos, onClose }: { stage: StageLike | null; pos: "left" | "right"; onClose(): void }) {
  if (!stage) return null;
  const stageEl = <StageLayout stage={stage} onClose={onClose} />;
  return (
    <StageContextProvider value={stage}>
      <Group wrap="nowrap">
        {pos === "right" && stageEl}
        <Stack px="lg">
          <ConfigValues stage={stage} />
        </Stack>
        {pos === "left" && stageEl}
      </Group>
    </StageContextProvider>
  );
}
