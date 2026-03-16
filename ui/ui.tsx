import { ActionIcon, Anchor, Button, Center, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { StagePair } from "./stage-pair.tsx";
import { GlobalControls } from "./global-controls.tsx";
import { IconBrandDiscordFilled, IconBrandGithubFilled, IconHelp } from "@tabler/icons-react";

function AboutModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Modal opened={opened} onClose={onClose} title={<strong>About SMX Web Config</strong>} size="lg">
      <Stack gap="sm">
        <Text>
          This is an unofficial, browser-based configuration tool for{" "}
          <Anchor href="https://stepmaniax.com" target="_blank">
            StepManiaX
          </Anchor>{" "}
          dance stages. It lets you view real-time sensor readings and manage stage settings by using the{" "}
          <Anchor href="https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API" target="_blank">
            WebHID API
          </Anchor>
          , which is only available in Chromium-based browsers (Chrome, Edge, Opera, Vivaldi, Brave, etc).
        </Text>
        <Text>
          Yes, that means Mac, Linux, and even Chromebooks are supported too! Most Linux users will need to{" "}
          <Anchor href="https://docs.google.com/document/d/1p8d1dvOg4TofBjw_8f9Z5bXZe36b_iKThG4-Js9jM-k/edit?tab=t.0">
            add a custom udev rule
          </Anchor>{" "}
          before this tool will work.
        </Text>
        <Text>
          This is a project by{" "}
          <Anchor href="https://github.com/noahm" target="_blank">
            Cathadan
          </Anchor>{" "}
          and{" "}
          <Anchor href="https://github.com/fchorney" target="_blank">
            SenPi
          </Anchor>
          . It is unofficial and not affiliated with Step Revolution, <em>and</em> under active development!
        </Text>
        <Text fw={600}>What you can do already:</Text>
        <Text component="ul" pl="md" m={0}>
          <li>Pair up to two SMX stages and configure them side by side</li>
          <li>View current sensitivity settings and calibration (tare) values</li>
          <li>
            Real-time overview of all <em>raw</em> sensor readings and error states
          </li>
          <li>
            Click a panel to view live <em>calibrated</em> sensor meter readings and error details
          </li>
          <li>Save the standard High/Normal/Low sensitivity profiles directly to a stage</li>
        </Text>
        <Text fw={600}>What we're still working on:</Text>
        <Text component="ul" pl="md" m={0}>
          <li>Set custom sensitivity thresholds on individual sensors</li>
          <li>Enable and disable individual sensors</li>
          <li>Upload idle/pressed animated GIFs to the stage</li>
        </Text>
        <Text fw={600}>Want to get involved?</Text>
        <Group justify="center">
          <Button
            component="a"
            href="https://discord.gg/VjvCKYVxBR"
            target="_blank"
            leftSection={<IconBrandDiscordFilled size={20} />}
            color="#5865f2"
          >
            Join our Discord
          </Button>
          <Button
            component="a"
            href="https://github.com/noahm/smx-config-web"
            target="_blank"
            leftSection={<IconBrandGithubFilled size={20} />}
            color="dark"
          >
            Contribute on GitHub
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function UI() {
  const [aboutOpened, { open: openAbout, close: closeAbout }] = useDisclosure(false);

  return (
    <>
      <AboutModal opened={aboutOpened} onClose={closeAbout} />
      <Center>
        <Stack>
          <Title ta="center">SMX Web Config</Title>
          <Group justify="center" gap="xs">
            <Title order={3}>StepManiaX stage management for your browser!</Title>
            <ActionIcon variant="subtle" onClick={openAbout}>
              <IconHelp />
            </ActionIcon>
          </Group>
          <GlobalControls />
          <StagePair />
        </Stack>
      </Center>
    </>
  );
}
