import { StageContextProvider } from "../context";
import { StageTest } from "./stage-test";
import { Stack, Fieldset } from "@mantine/core";
import { WritePresetButtons } from "../controls/apply-presets";
import { DebugCommands } from "../controls/debug-commands";
import { PanelTestModeToggle } from "../controls/panel-test-mode";
import { TestDataMode } from "../controls/test-data-mode";
import { ConfigValues } from "./config";
import type { StageLike } from "../../sdk/interface";

export function Stage({ stage }: { stage: StageLike | null }) {
  if (!stage) return null;
  return (
    <StageContextProvider value={stage}>
      <Stack px="lg">
        <StageTest stage={stage} />
        <Fieldset legend="Stage controls">
          <Stack>
            <DebugCommands />
            <WritePresetButtons />
            <TestDataMode />
            <PanelTestModeToggle />
          </Stack>
        </Fieldset>
        <ConfigValues stage={stage} />
      </Stack>
    </StageContextProvider>
  );
}
