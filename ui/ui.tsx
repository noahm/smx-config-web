import { ActionIcon, Anchor, Center, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { StagePair } from "./stage-pair.tsx";
import { GlobalControls } from "./global-controls.tsx";
import { IconHelp, IconMenu2 } from "@tabler/icons-react";
import directoryData from "./directory.json";
import { UnsupportedModal } from "./unsupported-modal.tsx";
import { AboutModal } from "./about.tsx";

function DirectoryDrawer({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Drawer opened={opened} onClose={onClose} title={<strong>SMX Community</strong>}>
      <Stack gap="md">
        <Stack gap="xs">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase">
            smx.tools
          </Text>
          {directoryData.sites.map((site) => (
            <Anchor key={site.href} href={site.href} target="_blank">
              <Stack gap={2}>
                <Text fw={600}>{site.label}</Text>
                <Text size="sm" c="dimmed">
                  {site.description}
                </Text>
              </Stack>
            </Anchor>
          ))}
        </Stack>
        <Stack gap="xs">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" mt="lg">
            Other Sites
          </Text>
          {directoryData.others.map((site) => (
            <Anchor key={site.href} href={site.href} target="_blank">
              <Stack gap={2}>
                <Text fw={600}>{site.label}</Text>
                <Text size="sm" c="dimmed">
                  {site.description}
                </Text>
              </Stack>
            </Anchor>
          ))}
        </Stack>
      </Stack>
    </Drawer>
  );
}

export function UI() {
  const [aboutOpened, { open: openAbout, close: closeAbout }] = useDisclosure(false);
  const [directoryOpened, { open: openDirectory, close: closeDirectory }] = useDisclosure(false);

  return (
    <>
      <UnsupportedModal openAbout={openAbout} />
      <AboutModal opened={aboutOpened} onClose={closeAbout} />
      <DirectoryDrawer opened={directoryOpened} onClose={closeDirectory} />
      <ActionIcon
        variant="subtle"
        onClick={openDirectory}
        style={{ position: "fixed", top: "var(--mantine-spacing-sm)", left: "var(--mantine-spacing-sm)" }}
        size="lg"
      >
        <IconMenu2 />
      </ActionIcon>
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
