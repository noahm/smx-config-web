import { Group, Button, Modal } from "@mantine/core";
import { browserSupported } from "./state";
import { useDisclosure } from "@mantine/hooks";

export function UnsupportedModal({ openAbout }: { openAbout: () => void }) {
  const [opened, { close }] = useDisclosure(!browserSupported);
  return (
    <Modal
      onClose={close}
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
            close();
          }}
        >
          Learn More
        </Button>
      </Group>
    </Modal>
  );
}
