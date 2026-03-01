import { StageContextProvider } from "../context";
import { useAtomValue, type Atom } from "jotai";
import { stagesBySerial } from "../state";
import { StageTest } from "./stage-test";
import { Stack, Fieldset } from "@mantine/core";
import { WritePresetButtons } from "../controls/apply-presets";
import { DebugCommands } from "../controls/debug-commands";
import { PanelTestModeToggle } from "../controls/panel-test-mode";
import { TestDataMode } from "../controls/test-data-mode";
import { ConfigValues } from "./config";

function useStageValue(stageSerial$: Atom<string | undefined>) {
  const serial = useAtomValue(stageSerial$);
  return useAtomValue(stagesBySerial(serial));
}

export function Stage(props: { stageSerialAtom: Atom<string | undefined> }) {
  const stage = useStageValue(props.stageSerialAtom);
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
