import { useAtomValue, useAtom } from "jotai";
import { useEffect } from "react";

import { DebugCommands } from "./DebugCommands.tsx";
import { open_smx_device, promptSelectDevice } from "./pad-coms.ts";
import { browserSupported, displayTestData$, p1Dev$, p2Dev$, statusText$ } from "./state.ts";
import { StageTest } from "./stage/stage-test.tsx";

export function UI() {
  useEffect(() => {
    // once, on load, get paired devices and attempt connection
    if (browserSupported) {
      navigator.hid.getDevices().then((devices) =>
        devices.map((device) => {
          console.log(`Found device: ${device.productName}`);
          open_smx_device(device);
        }),
      );
    }
  }, []);

  return (
    <>
      <h1>
        SMX Web Config{" "}
        <small>
          (<a href="https://github.com/noahm/smx-config-web">source</a>)
        </small>
      </h1>
      <StageTest deviceAtom={p2Dev$} />
      <StageTest deviceAtom={p1Dev$} />
      <p>
        <PickDeviceButton /> <DebugCommands />
      </p>
      <p>
        <TestDataDisplayToggle />
      </p>
      <StatusDisplay />
    </>
  );
}

function PickDeviceButton() {
  return (
    <button type="button" disabled={!browserSupported} onClick={promptSelectDevice}>
      Pick device...
    </button>
  );
}

function StatusDisplay() {
  const statusText = useAtomValue(statusText$);
  return <pre>{statusText}</pre>;
}

function TestDataDisplayToggle() {
  const [enabled, setToggle] = useAtom(displayTestData$);

  return (
    <label>
      <input type="checkbox" checked={enabled} onChange={() => setToggle((prev) => !prev)} /> Read Stage Test Values
    </label>
  );
}
