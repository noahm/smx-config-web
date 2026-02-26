import { DebugCommands } from "./controls/debug-commands.tsx";
import { useHidDevices } from "./pad-coms.tsx";
import { selectedStage$ } from "./state.ts";
import { StageTest } from "./stage/stage-test.tsx";
import { ConfigValues } from "./stage/config.tsx";
import { PickDevice } from "./controls/pick-device.tsx";
import { TestDataMode } from "./controls/test-data-mode.tsx";
import { PanelTestModeToggle } from "./controls/panel-test-mode.tsx";
import { WritePresetButtons } from "./controls/apply-presets.tsx";
import { Fieldset, Group, Stack, Typography } from "@mantine/core";
// import { PanelMeters } from "./common/panel-meters.tsx";

export function UI() {
  useHidDevices();

  return (
    <>
      <Typography m="lg">
        <h1>SMX Web Config</h1>
      </Typography>
      <StageTest stageAtom={selectedStage$} />
      <Stack px="lg">
        <Group>
          <PickDevice />
        </Group>
        <Fieldset legend="Stage controls">
          <Stack>
            <DebugCommands />
            <WritePresetButtons />
            <TestDataMode />
            <PanelTestModeToggle />
          </Stack>
        </Fieldset>
        <ConfigValues stageAtom={selectedStage$} />
      </Stack>

      {/* <PanelMeters /> */}
      {/* <StatusDisplay /> */}
      <footer>
        A project of Cathadan and SenPi. This tool is unofficial and not affiliated with Step Revolution. Want to help?{" "}
        <a href="https://discord.gg/VjvCKYVxBR" target="_blank" rel="noreferrer">
          join our discord
        </a>{" "}
        or <a href="https://github.com/noahm/smx-config-web">browse the source code</a>
      </footer>
    </>
  );
}
