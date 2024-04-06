import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID, SMXStage } from "../sdk";
import { stages$, nextStatusTextLine$, statusText$, uiState } from "./state";

export async function promptSelectDevice() {
  const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: SMX_USB_VENDOR_ID, productId: SMX_USB_PRODUCT_ID }],
  });

  if (!devices.length || !devices[0]) {
    uiState.set(statusText$, "no device selected");
    return;
  }

  await open_smx_device(devices[0]);
}

export async function open_smx_device(dev: HIDDevice) {
  if (!dev.opened) {
    await dev.open();
  }

  const stage = new SMXStage(dev);
  await stage.init().then(() => {
    uiState.set(stages$, (stages) => {
      return {
        ...stages,
        [stage.info?.player || 0]: stage, // TODO: Is there a better way to handle this?
      };
    });
    uiState.set(
      nextStatusTextLine$,
      `status: device opened: ${dev.productName}:P${stage.info?.player}:${stage.info?.serial}`,
    );
  });
}

/**
 * Resolves to a union of all keys of T which are functions
 */
type FunctionKeys<T extends object> = keyof {
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

/** anything here will appear in the debug UI to dispatch at will */
export const DEBUG_COMMANDS: Record<string, FunctionKeys<SMXStage>> = {
  requestConfig: "updateConfig",
  requestTestData: "updateTestData",
};
