import { useEffect, type ReactNode } from "react";
import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID, SMXStage } from "../sdk";
import { stages$, uiState, selectedStageSerial$ } from "./state";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export function useHidDevices() {
  useEffect(() => {
    // once, on load, get paired devices and attempt connection
    if ("hid" in navigator) {
      navigator.hid.getDevices().then((devices) =>
        devices.forEach((device) => {
          open_smx_device(device, "auto").then((message) => {
            if (message) notifications.show({ message });
          });
        }),
      );
      const ac = new AbortController();
      navigator.hid.addEventListener(
        "connect",
        (ev) => {
          open_smx_device(ev.device, "auto").then((message) => {
            if (message) notifications.show({ message });
          });
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
    } else {
      modals.open({
        title: "Browser unsupported",
        content: "Your browser does not support WebHID. Try with a desktop version of Chrome, Vivaldi, Brave, etc.",
        closeOnClickOutside: false,
        closeOnEscape: false,
      });
    }
  }, []);
}

const devToStage = new WeakMap<HIDDevice, SMXStage>();

export async function promptSelectDevice(): Promise<ReactNode> {
  const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: SMX_USB_VENDOR_ID, productId: SMX_USB_PRODUCT_ID }],
  });

  if (!devices.length || !devices[0]) {
    return "no device selected in prompt";
  }

  return open_smx_device(devices[0], true);
}

/**
 * @param forceSelect when true, will make the currently selected stage. when auto, will make selected if no stage is currently selected
 */
async function open_smx_device(dev: HIDDevice, forceSelect: boolean | "auto" = false): Promise<ReactNode> {
  if (!dev.opened) {
    try {
      await dev.open();
    } catch (e) {
      console.error(e);
      return (
        <>
          failed to open device; more details in the browser console. if you are using linux, see{" "}
          <a href="https://docs.google.com/document/d/1p8d1dvOg4TofBjw_8f9Z5bXZe36b_iKThG4-Js9jM-k/edit?tab=t.0">
            these notes on Udev rules
          </a>
        </>
      );
    }
  }

  const stage = new SMXStage(dev);
  await stage.init();

  const serial = stage.info?.serial;
  if (!serial) {
    return "selected pad failed to report a serial number";
  }

  devToStage.set(dev, stage);
  uiState.set(stages$, (stages) => {
    return {
      ...stages,
      [serial]: stage,
    };
  });
  if (forceSelect === true) {
    uiState.set(selectedStageSerial$, serial);
  } else if (forceSelect === "auto" && !uiState.get(selectedStageSerial$)) {
    uiState.set(selectedStageSerial$, serial);
  }
  return `status: device opened: ${dev.productName}:P${stage.info?.player}:${stage.info?.serial}`;
}

/**
 * Resolves to a union of all keys of T which are functions
 */
type FunctionKeys<T extends object> = keyof {
  [K in keyof T as T[K] extends () => void ? K : never]: T[K];
};

/** anything here will appear in the debug UI to dispatch at will */
export const DEBUG_COMMANDS = {
  // requestConfig: "updateConfig",
  // writeConfig: "writeConfig",
  // requestTestData: "updateTestData",
  forceRecalibration: "forceRecalibration",
  factoryReset: "factoryReset",
} as const satisfies Record<string, FunctionKeys<SMXStage>>;
