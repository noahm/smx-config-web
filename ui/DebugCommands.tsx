import { useAtomValue } from "jotai";
import { useState } from "react";
import { DEBUG_COMMANDS } from "./pad-coms";
import { selectedStage$ } from "./state.ts";

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
      <select
        value={selectedCommand}
        onChange={(e) => setSelectedCommand(e.currentTarget.value as typeof selectedCommand)}
      >
        <option disabled value="">
          Select Command
        </option>
        {cmds.map(([k, v]) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>{" "}
      <button type="button" disabled={!handleSendCommand} onClick={handleSendCommand}>
        Send
      </button>
    </>
  );
}
