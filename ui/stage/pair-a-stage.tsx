import { Button, Center, Overlay } from "@mantine/core";
import { StageLayout } from "./stage-test";
import { promptSelectDevice } from "../pad-coms";
import { IconCirclePlus } from "@tabler/icons-react";

export function PairAStage() {
  return (
    <div style={{ position: "relative", display: "inline-block", padding: "1em" }}>
      <StageLayout stage={undefined} />
      <Overlay blur={5} backgroundOpacity={0}>
        <Center h="100%">
          <Button fz="h2" onClick={promptSelectDevice}>
            <IconCirclePlus /> Pair a stage
          </Button>
        </Center>
      </Overlay>
    </div>
  );
}
