import { Group, Button, Modal } from "@mantine/core";
import { useAtom } from "jotai";
import { unsupportedOpen$ } from "./state";

export function UnsupportedModal({ openAbout }: { openAbout(): void }) {
  const [opened, setOpened] = useAtom(unsupportedOpen$);
  return (
    <Modal
      onClose={() => setOpened(false)}
      opened={opened}
      title={<strong>Browser unsupported</strong>}
      centered
      closeOnClickOutside={false}
    >
      Your browser does not support WebHID. Try with a desktop version of Chrome, Vivaldi, Brave, etc.
      <Group mt="lg" justify="center">
        <Button
          onClick={() => {
            openAbout();
            setOpened(false);
          }}
        >
          Learn More
        </Button>
      </Group>
    </Modal>
  );
}
