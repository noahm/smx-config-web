import { useHidDevices } from "./pad-coms.tsx";
import { Center, Title } from "@mantine/core";
import { StagePair } from "./stage-pair.tsx";

export function UI() {
  useHidDevices();

  return (
    <>
      <Title>SMX Web Config</Title>
      <Center>
        <StagePair />
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
