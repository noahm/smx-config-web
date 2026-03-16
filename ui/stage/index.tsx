import { StageContextProvider } from "../context";
import { StageTest } from "./stage-test";
import { Button, Fieldset, Group, Stack } from "@mantine/core";
import { WritePresetButtons } from "../controls/apply-presets";
import { PanelTestModeToggle } from "../controls/panel-test-mode";
import { ConfigValues } from "./config";
import type { StageLike } from "../../sdk/interface";
import { ResetButton } from "../controls/reset-button";
import { IconPlayerEject } from "@tabler/icons-react";

export function Stage({ stage, pos, onClose }: { stage: StageLike | null; pos: "left" | "right"; onClose(): void }) {
  if (!stage) return null;
  const stageEl = <StageTest stage={stage} />;
  return (
    <StageContextProvider value={stage}>
      <Group wrap="nowrap">
        {pos === "right" && stageEl}
        <Stack px="lg">
          <Fieldset legend="Stage controls">
            <Stack>
              <WritePresetButtons />
              <PanelTestModeToggle />
              <Group>
                <ResetButton />
                <Button flex="1" color="yellow" onClick={onClose}>
                  <IconPlayerEject /> Eject
                </Button>
              </Group>
            </Stack>
          </Fieldset>
          <ConfigValues stage={stage} />
        </Stack>
        {pos === "left" && stageEl}
      </Group>
    </StageContextProvider>
  );
}
