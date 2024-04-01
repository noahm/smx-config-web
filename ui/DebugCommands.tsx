import { useAtomValue } from "jotai";
import { useState } from "react";
import { DEBUG_COMMANDS } from "./pad-coms";
import { devices$ } from "./state.ts";

export function DebugCommands() {
  const connectedDevices = useAtomValue(devices$);
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<keyof typeof DEBUG_COMMANDS | "">("");
  const cmds = Array.from(Object.entries(DEBUG_COMMANDS));
  const device = connectedDevices[selectedPlayer];
  const handleSendCommand =
    selectedCommand && device
      ? () => {
          DEBUG_COMMANDS[selectedCommand](device);
        }
      : undefined;
  return (
    <>
      <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(Number(e.target.value))}>
        <option disabled value="0">
          Select Stage
        </option>
        <option value="1" disabled={!connectedDevices[1]}>
          Player 1
        </option>
        <option value="2" disabled={!connectedDevices[2]}>
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
