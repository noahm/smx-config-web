import { getDeviceInfo, getSensorTestData, getStageConfig } from "../sdk";
import { SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID } from "../sdk/api";
import { SMXConfig } from "../sdk/commands/config";
import { SMXDeviceInfo } from "../sdk/commands/data_info";
import { SMXSensorTestData } from "../sdk/commands/sensor_test";
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
  const packet = await getDeviceInfo(dev);
  const device_info = new SMXDeviceInfo(packet);
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

export async function requestConfig(dev: HIDDevice) {
  const response = await getStageConfig(dev);
  const smxconfig = new SMXConfig(response);

  // Right now I just want to confirm that decoding and re-encoding gives back the same data
  const encoded_config = smxconfig.encode();
  if (encoded_config) {
    const buf = new Uint8Array(encoded_config.buffer);
    console.log("Same Thing:", response.slice(2, -1).toString() === buf.toString());
  }
}

export async function requestTestData(dev: HIDDevice) {
  const response = await getSensorTestData(dev);
  return new SMXSensorTestData(response);
}

/** anything here will appear in the debug UI to dispatch at will */
export const DEBUG_COMMANDS: Record<string, (dev: HIDDevice) => unknown> = {
  requestConfig,
  requestTestData,
};
