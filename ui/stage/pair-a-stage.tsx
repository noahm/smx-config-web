import { Button, Center, Overlay } from "@mantine/core";
import { StageLayout } from "./stage-layout";
import { promptSelectDevice } from "../pad-coms";
import { IconSquarePlus } from "@tabler/icons-react";

export function PairAStage() {
  return (
    <Center p="md" pos="relative">
      <StageLayout stage={undefined} />
      <Overlay blur={5} backgroundOpacity={0}>
        <Center h="100%">
          <Button leftSection={<IconSquarePlus size={32} />} size="xl" fz="h1" onClick={promptSelectDevice} radius="md">
            Pair a stage
          </Button>
        </Center>
      </Overlay>
    </Center>
  );
}
