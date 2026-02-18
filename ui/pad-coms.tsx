import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID, SMXStage } from "../sdk";
import { stages$, nextStatusTextLine$, uiState, selectedStageSerial$ } from "./state";

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

export async function open_smx_device(dev: HIDDevice, autoSelect = false) {
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
  if (autoSelect) {
    uiState.set(selectedStageSerial$, serial);
  }
}

/**
 * Resolves to a union of all keys of T which are functions
 */
type FunctionKeys<T extends object> = keyof {
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

/** anything here will appear in the debug UI to dispatch at will */
export const DEBUG_COMMANDS = {
  requestConfig: "updateConfig",
  writeConfig: "writeConfig",
  requestTestData: "updateTestData",
  forceRecalibration: "forceRecalibration",
  factoryReset: "factoryReset",
} as const satisfies Record<string, FunctionKeys<SMXStage>>;
