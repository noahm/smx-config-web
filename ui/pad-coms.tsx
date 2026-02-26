import { useEffect } from "react";
import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID, SMXStage } from "../sdk";
import { stages$, nextStatusTextLine$, uiState, selectedStageSerial$ } from "./state";

export function usePreviouslyPairedDevices() {
  useEffect(() => {
    // once, on load, get paired devices and attempt connection
    if ("hid" in navigator) {
      navigator.hid.getDevices().then((devices) =>
        devices.forEach((device) => {
          open_smx_device(device, "auto");
        }),
      );
      const ac = new AbortController();
      navigator.hid.addEventListener(
        "connect",
        (ev) => {
          open_smx_device(ev.device, "auto");
        },
        { signal: ac.signal },
      );
      navigator.hid.addEventListener(
        "disconnect",
        (ev) => {
          const stage = devToStage.get(ev.device);
          if (stage) {
            const serial = stage.info?.serial;
            if (serial) {
              uiState.set(stages$, (prev) => {
                const next = { ...prev };
                delete next[serial];
                return next;
              });
              if (uiState.get(selectedStageSerial$) === serial) {
                uiState.set(selectedStageSerial$, undefined);
              }
            }
          }
        },
        { signal: ac.signal },
      );
      return () => ac.abort();
    }
  }, []);
}

const devToStage = new WeakMap<HIDDevice, SMXStage>();

export async function promptSelectDevice() {
  const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: SMX_USB_VENDOR_ID, productId: SMX_USB_PRODUCT_ID }],
  });

  if (!devices.length || !devices[0]) {
    uiState.set(nextStatusTextLine$, "no device selected in prompt");
    return;
  }

  await open_smx_device(devices[0], true);
}

/**
 * @param forceSelect when true, will make the currently selected stage. when auto, will make selected if no stage is currently selected
 */
async function open_smx_device(dev: HIDDevice, forceSelect: boolean | "auto" = false): Promise<void> {
  if (!dev.opened) {
    try {
      await dev.open();
    } catch (e) {
      console.error(e);
      uiState.set(nextStatusTextLine$, "failed to open device; more details in the browser console.");
      uiState.set(
        nextStatusTextLine$,
        <>
          if you are using linux, see{" "}
          <a href="https://docs.google.com/document/d/1p8d1dvOg4TofBjw_8f9Z5bXZe36b_iKThG4-Js9jM-k/edit?tab=t.0">
            these notes on Udev rules
          </a>
        </>,
      );
      return;
    }
  }

  const stage = new SMXStage(dev);
  await stage.init();

  const serial = stage.info?.serial;
  if (!serial) {
    uiState.set(nextStatusTextLine$, "selected pad failed to report a serial number");
    return;
  }

  devToStage.set(dev, stage);
  uiState.set(stages$, (stages) => {
    return {
      ...stages,
      [serial]: stage,
    };
  });
  uiState.set(
    nextStatusTextLine$,
    `status: device opened: ${dev.productName}:P${stage.info?.player}:${stage.info?.serial}`,
  );
  if (forceSelect === true) {
    uiState.set(selectedStageSerial$, serial);
  } else if (forceSelect === "auto" && !uiState.get(selectedStageSerial$)) {
    uiState.set(selectedStageSerial$, serial);
  }
}

/**
 * Resolves to a union of all keys of T which are functions
 */
type FunctionKeys<T extends object> = keyof {
  [K in keyof T as T[K] extends () => void ? K : never]: T[K];
};

/** anything here will appear in the debug UI to dispatch at will */
export const DEBUG_COMMANDS = {
  requestConfig: "updateConfig",
  writeConfig: "writeConfig",
  requestTestData: "updateTestData",
  forceRecalibration: "forceRecalibration",
  factoryReset: "factoryReset",
} as const satisfies Record<string, FunctionKeys<SMXStage>>;
