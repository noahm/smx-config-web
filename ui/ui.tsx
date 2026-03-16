import { useHidDevices } from "./pad-coms.tsx";
import { Box, Center, Stack, Title } from "@mantine/core";
import { StagePair } from "./stage-pair.tsx";
import { GlobalControls } from "./global-controls.tsx";

export function UI() {
  useHidDevices();

  return (
    <>
      <Center>
        <Stack>
          <Title ta="center">SMX Web Config</Title>
          <Title ta="center" order={3}>
            StepManiaX stage management for your browser!
          </Title>
          <GlobalControls />
          <StagePair />
        </Stack>
      </Center>

      <Box component="footer" px="md">
        A project of Cathadan and SenPi. This tool is unofficial and not affiliated with Step Revolution. Want to help?{" "}
        <a href="https://discord.gg/VjvCKYVxBR" target="_blank" rel="noreferrer">
          join our discord
        </a>{" "}
        or <a href="https://github.com/noahm/smx-config-web">browse the source code</a>
      </Box>
    </>
  );
}
