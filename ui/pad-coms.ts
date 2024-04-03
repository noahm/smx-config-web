import { getDeviceInfo, getSensorTestData, getStageConfig } from "../sdk";
import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID } from "../sdk/api";
import { devices$, nextStatusTextLine$, statusText$, uiState } from "./state";

// function formatDataForDisplay(data: DataView) {
//   const len = data.byteLength;

//   // Read raw report into groups of 8 bytes.
//   let str = "";
//   for (let i = 0; i !== len; ++i) {
//     if (i !== 0 && i % 8 === 0) str += "\n";

//     // biome-ignore lint/style/useTemplate: <explanation>
//     str += data.getUint8(i).toString(2).padStart(8, "0") + " ";
//   }

//   // Read raw report into groups of 8 bytes of hex
//   str += "\n\n";
//   for (let i = 0; i !== len; ++i) {
//     if (i !== 0 && i % 8 === 0) str += "\n";

//     // biome-ignore lint/style/useTemplate: <explanation>
//     str += data.getUint8(i).toString(16).padStart(2, "0") + " ";
//   }

//   return `report:\n${str}`;
// }

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
  // Get the device info an find the player number
  const device_info = await getDeviceInfo(dev);
  uiState.set(devices$, (devices) => {
    return {
      ...devices,
      [device_info.player]: dev,
    };
  });
  uiState.set(
    nextStatusTextLine$,
    `status: device opened: ${dev.productName}:P${device_info.player}:${device_info.serial}`,
  );
}

/** anything here will appear in the debug UI to dispatch at will */
export const DEBUG_COMMANDS: Record<string, (dev: HIDDevice) => unknown> = {
  requestConfig: getStageConfig,
  requestTestData: getSensorTestData,
};
