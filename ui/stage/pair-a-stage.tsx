import { Center, Overlay, Title } from "@mantine/core";
import { StageTest } from "./stage-test";
import { promptSelectDevice } from "../pad-coms";

export function PairAStage() {
  return (
    <div style={{ position: "relative", cursor: "pointer", display: "inline-block", padding: "1em" }}>
      <StageTest stage={undefined} />
      <Overlay blur={5} onClick={promptSelectDevice} backgroundOpacity={0}>
        <Center h="100%">
          <Title order={1}>Pair a stage</Title>
        </Center>
      </Overlay>
    </div>
  );
}
