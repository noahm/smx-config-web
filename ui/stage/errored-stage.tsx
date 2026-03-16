import { Overlay, Center, Button, Title } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import type { FallbackProps } from "react-error-boundary";
import { StageLayout } from "./stage-test";

export function ErroredStage(props: FallbackProps) {
  return (
    <div style={{ position: "relative", display: "inline-block", padding: "1em" }}>
      <StageLayout stage={undefined} />
      <Overlay blur={5} backgroundOpacity={0}>
        <Center h="100%">
          <Title>Uh-oh, app broke</Title>
          <Button fz="h2" onClick={props.resetErrorBoundary}>
            <IconRefresh /> Reset UI?
          </Button>
        </Center>
      </Overlay>
    </div>
  );
}
