import { useAtomValue } from "jotai";
import { useEffect } from "react";

import {
  open_smx_device,
  promptSelectDevice,
  requestConfig,
} from "./pad-coms.ts";
import { browserSupported, p1Dev$, statusText$ } from "./state.ts";

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
      <h1>SMX Web Config</h1>
      <PickDeviceButton /> <FetchConfigButton />
      <StatusDisplay />
    </>
  );
}

function PickDeviceButton() {
  return (
    <button
      type="button"
      disabled={!browserSupported}
      onClick={promptSelectDevice}
    >
      Pick device...
    </button>
  );
}

function FetchConfigButton() {
  const device = useAtomValue(p1Dev$);
  const handleClick = device ? () => requestConfig(device) : undefined;
  return (
    <button type="button" disabled={!handleClick} onClick={handleClick}>
      Fetch P1 Config...
    </button>
  );
}

function StatusDisplay() {
  const statusText = useAtomValue(statusText$);
  return <pre>{statusText}</pre>;
}
