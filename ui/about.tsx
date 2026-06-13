import { Anchor, Badge, Button, Center, Drawer, Group, Modal, Stack, Text } from "@mantine/core";
import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconBrandYoutubeFilled,
  IconSparklesFilled,
} from "@tabler/icons-react";

export function AboutModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  return (
    <Modal opened={opened} onClose={onClose} title={<strong>About SMX Web Config</strong>} size="lg">
      <Stack gap="sm">
        <Text>
          This is an <em>unofficial</em> configuration tool for{" "}
          <Anchor href="https://stepmaniax.com" target="_blank" rel="noopener">
            StepManiaX
          </Anchor>{" "}
          dance stages. It provides real-time sensor readings and stage settings management using the{" "}
          <Anchor href="https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API" target="_blank" rel="noopener">
            WebHID API
          </Anchor>
          , which is only available in Chromium-based browsers (Chrome, Edge, Opera, Vivaldi, Brave, etc).
        </Text>
        <Text>
          Yes, that means Mac, Linux, and even Chromebooks are supported too! Most Linux users will need to{" "}
          <Anchor
            href="https://docs.google.com/document/d/1p8d1dvOg4TofBjw_8f9Z5bXZe36b_iKThG4-Js9jM-k/edit?tab=t.0"
            rel="noopener"
          >
            add a custom udev rule
          </Anchor>{" "}
          before this tool will work.
        </Text>

        <Text>
          If you don't have stages of your own,{" "}
          <Anchor href="https://youtu.be/WTPVD_9dQi0" target="_blank" rel="noopener">
            <IconBrandYoutubeFilled size="20" /> this video demo
          </Anchor>{" "}
          will give you a better idea of how the app works.
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
          <li>
            Enable and disable individual sensors{" "}
            <Badge>
              <IconSparklesFilled size={16} /> New!
            </Badge>
          </li>
          <li>
            Set custom sensitivity thresholds on individual sensors{" "}
            <Badge>
              <IconSparklesFilled size={16} /> New!
            </Badge>
          </li>
        </Text>
        <Text fw={600}>Want to get involved?</Text>
        <Text>
          This is an open-source project under active development by{" "}
          <Anchor href="https://github.com/noahm" target="_blank" rel="noopener">
            Cathadan
          </Anchor>{" "}
          and{" "}
          <Anchor href="https://github.com/fchorney" target="_blank" rel="noopener">
            SenPi
          </Anchor>
          . Contributions are welcome!
        </Text>
        <Group justify="center">
          <Button
            component="a"
            href="https://discord.gg/VjvCKYVxBR"
            target="_blank"
            rel="noopener"
            leftSection={<IconBrandDiscordFilled size={20} />}
            color="#5865f2"
          >
            Join our Discord
          </Button>
          <Button
            component="a"
            href="https://github.com/noahm/smx-config-web"
            target="_blank"
            rel="noopener"
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
