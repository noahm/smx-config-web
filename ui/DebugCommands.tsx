import { useAtomValue } from "jotai";
import { useState } from "react";
import { DEBUG_COMMANDS } from "./pad-coms";
import { stages$ } from "./state.ts";
import { RGB } from "../sdk/utils.ts";

export function DebugCommands() {
  const connectedStages = useAtomValue(stages$);
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<keyof typeof DEBUG_COMMANDS | "">("");
  const cmds = Array.from(Object.entries(DEBUG_COMMANDS));
  const stage = connectedStages[selectedPlayer];
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
      <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(Number(e.target.value))}>
        <option disabled value="0">
          Select Stage
        </option>
        <option value="1" disabled={!connectedStages[1]}>
          Player 1
        </option>
        <option value="2" disabled={!connectedStages[2]}>
          Player 2
        </option>
      </select>{" "}
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
