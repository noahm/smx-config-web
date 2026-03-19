import { useEffect } from "react";
import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID, SMXStage } from "../sdk";
import { uiState, activeLeftStage$, activeRightStage$ } from "./state";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

export function useHidDevices() {
  useEffect(() => {
    // once, on load, get paired devices and attempt connection
    if ("hid" in navigator) {
      navigator.hid.getDevices().then((devices) =>
        devices.forEach((device) => {
          openAndWrap(device).then(autoAssignStage);
        }),
      );
      const ac = new AbortController();
      navigator.hid.addEventListener(
        "connect",
        (ev) => {
          openAndWrap(ev.device).then(autoAssignStage);
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
              if (uiState.get(activeLeftStage$) === stage) {
                uiState.set(activeLeftStage$, null);
              }
              if (uiState.get(activeRightStage$) === stage) {
                uiState.set(activeRightStage$, null);
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

export async function promptSelectDevice(): Promise<SMXStage | null> {
  const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: SMX_USB_VENDOR_ID, productId: SMX_USB_PRODUCT_ID }],
  });

  if (!devices.length || !devices[0]) {
    return null;
  }

  return openAndWrap(devices[0]);
}

/**
 * Opens a selected device and wraps it with our SMXStage class, handling error
 * messaging in the case that opening the stage fails.
 * @param forceSelect when true, will make the currently selected stage.
 * when auto, will make selected if no stage is currently selected
 */
async function openAndWrap(dev: HIDDevice): Promise<SMXStage | null> {
  if (!dev.opened) {
    try {
      await dev.open();
    } catch (e) {
      console.error(e);
      notifications.show({
        autoClose: false,
        message: (
          <>
            failed to open device; more details in the browser console. if you are using linux, see{" "}
            <a href="https://docs.google.com/document/d/1p8d1dvOg4TofBjw_8f9Z5bXZe36b_iKThG4-Js9jM-k/edit?tab=t.0">
              these notes on Udev rules
            </a>
          </>
        ),
      });
      return null;
    }
  } else if (devToStage.has(dev)) {
  }

  const stage = new SMXStage(dev);
  await stage.init();

  devToStage.set(dev, stage);
  return stage;
}

export async function promptAndAutoAssignStage() {
  autoAssignStage(await promptSelectDevice());
}

function autoAssignStage(stage: SMXStage | null) {
  if (!stage) return;
  /**
   * an array that contains both left and right side "slots", where the first item is
   * the one where this pad would natrually fit given it reporting P1 or P2.
   */
  const sidePrefOrder =
    stage.info?.player === 1 ? [activeLeftStage$, activeRightStage$] : [activeRightStage$, activeLeftStage$];
  for (const padSlot$ of sidePrefOrder) {
    if (!uiState.get(padSlot$)) {
      uiState.set(padSlot$, stage);
      notifications.show({
        message: `Device opened: ${stage.info?.serial} (P${stage.info?.player || "?"})`,
      });
      return;
    }
  }
  notifications.show({ message: `device opened, but no UI slots are available` });
}
