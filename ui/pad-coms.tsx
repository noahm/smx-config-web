import { useEffect, type ReactNode } from "react";
import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID, SMXStage } from "../sdk";
import { stagesBySerial, uiState, activeLeftStageSerial$, activeRightStageSerial$ } from "./state";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export function useHidDevices() {
  useEffect(() => {
    // once, on load, get paired devices and attempt connection
    if ("hid" in navigator) {
      navigator.hid.getDevices().then((devices) =>
        devices.forEach((device) => {
          open_smx_device(device).then((message) => {
            if (message) notifications.show({ message });
          });
        }),
      );
      const ac = new AbortController();
      navigator.hid.addEventListener(
        "connect",
        (ev) => {
          open_smx_device(ev.device).then((message) => {
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
              uiState.set(stagesBySerial(serial), undefined);
              if (uiState.get(activeLeftStageSerial$) === serial) {
                uiState.set(activeLeftStageSerial$, undefined);
              }
              if (uiState.get(activeRightStageSerial$) === serial) {
                uiState.set(activeRightStageSerial$, undefined);
              }
            }
          }
        },
        { signal: ac.signal },
      );
      return () => ac.abort();
    } else {
      modals.open({
        centered: true,
        title: <strong>Browser unsupported</strong>,
        children: "Your browser does not support WebHID. Try with a desktop version of Chrome, Vivaldi, Brave, etc.",
        closeOnClickOutside: false,
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

  return open_smx_device(devices[0]);
}

/**
 * @param forceSelect when true, will make the currently selected stage. when auto, will make selected if no stage is currently selected
 */
async function open_smx_device(dev: HIDDevice): Promise<ReactNode> {
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
  uiState.set(stagesBySerial(serial), stage);
  /**
   * an array that contains both left and right side "slots", where the first item is
   * the one where this pad would natrually fit given it reporting P1 or P2.
   */
  const sidePrefOrder =
    stage.info?.player === 1
      ? [activeLeftStageSerial$, activeRightStageSerial$]
      : [activeRightStageSerial$, activeLeftStageSerial$];
  for (const padSlot$ of sidePrefOrder) {
    if (!uiState.get(padSlot$)) {
      uiState.set(padSlot$, serial);
      return `device opened: ${dev.productName}:P${stage.info?.player}:${stage.info?.serial}`;
    }
  }
  return `device opened, but no UI slots are available`;
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
