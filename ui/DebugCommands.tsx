import { useAtomValue } from "jotai";
import { useState } from "react";
import { DEBUG_COMMANDS } from "./pad-coms";
import { selectedStage$ } from "./state.ts";
import { RGB } from "../sdk/utils.ts";

const cmds = Array.from(Object.entries(DEBUG_COMMANDS));

export function DebugCommands() {
  const stage = useAtomValue(selectedStage$);
  const [selectedCommand, setSelectedCommand] = useState<keyof typeof DEBUG_COMMANDS | "">("");
  const handleSendCommand =
    selectedCommand && stage
      ? async () => {
          const cmd = DEBUG_COMMANDS[selectedCommand];
          if (cmd === "setLightStrip") {
            // TODO: We don't even expose this to the dropdown, but this seemed
            // like the easiest fix for now.
            await stage[cmd](new RGB(0, 0, 255));
          } else {
            await stage[cmd]();
          }
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
