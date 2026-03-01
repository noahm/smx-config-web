import { useHidDevices } from "./pad-coms.tsx";
import { Center, Stack, Title } from "@mantine/core";
import { StagePair } from "./stage-pair.tsx";
import { GlobalControls } from "./global-controls.tsx";

export function UI() {
  useHidDevices();

  return (
    <>
      <Center>
        <Stack>
          <Title ta="center">SMX Web Config</Title>
          <GlobalControls />
          <StagePair />
        </Stack>
      </Center>

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
