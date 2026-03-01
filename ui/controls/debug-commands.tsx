import { useState } from "react";
import { DEBUG_COMMANDS } from "../pad-coms";
import { Button, Group, SegmentedControl } from "@mantine/core";
import { useStage } from "../context.tsx";

const cmds = Object.keys(DEBUG_COMMANDS) as Array<keyof typeof DEBUG_COMMANDS>;

export function DebugCommands() {
  const stage = useStage();
  const [selectedCommand, setSelectedCommand] = useState<keyof typeof DEBUG_COMMANDS>(cmds[0]);
  const handleSendCommand =
    selectedCommand && stage
      ? async () => {
          const cmd = DEBUG_COMMANDS[selectedCommand];
          await stage[cmd]();
        }
      : undefined;
  return (
    <Group gap="0.3rem">
      <SegmentedControl<keyof typeof DEBUG_COMMANDS>
        value={selectedCommand}
        disabled={!stage}
        data={[
          ...cmds.map((label) => ({
            value: label,
            label,
          })),
        ]}
        onChange={(v) => setSelectedCommand(v)}
      />
      <Button disabled={!handleSendCommand || !stage} onClick={handleSendCommand}>
        Send to Stage
      </Button>
    </Group>
  );
}
