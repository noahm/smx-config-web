import { useAtomValue } from "jotai";
import { useState } from "react";
import { DEBUG_COMMANDS } from "../pad-coms";
import { selectedStage$ } from "../state.ts";
import { Button, Select } from "antd";

const cmds = Array.from(Object.entries(DEBUG_COMMANDS));

export function DebugCommands() {
  const stage = useAtomValue(selectedStage$);
  const [selectedCommand, setSelectedCommand] = useState<keyof typeof DEBUG_COMMANDS | "">("");
  const handleSendCommand =
    selectedCommand && stage
      ? async () => {
          const cmd = DEBUG_COMMANDS[selectedCommand];
          await stage[cmd]();
        }
      : undefined;
  return (
    <>
      <Select
        value={selectedCommand}
        disabled={!stage}
        options={[
          { value: "", label: "Select Command", disabled: true },
          ...cmds.map(([k]) => ({
            value: k,
            label: k,
          })),
        ]}
        onChange={(v) => setSelectedCommand(v)}
      />{" "}
      <Button disabled={!handleSendCommand || !stage} onClick={handleSendCommand}>
        Send
      </Button>
    </>
  );
}
