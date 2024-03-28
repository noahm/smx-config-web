import { API_COMMAND, SMX_USB_PRODUCT_ID, SMX_USB_VENDOR_ID } from "../sdk/api";
import { nextReportCommand, process_packets, send_data } from "../sdk/packet";

import { SMXConfig } from "../sdk/commands/config.js";
import { SMXDeviceInfo } from "../sdk/commands/data_info.js";

function displayData(data: DataView, targetEl: HTMLElement) {
  const len = data.byteLength;

  // Read raw report into groups of 8 bytes.
  let str = "";
  for (let i = 0; i !== len; ++i) {
    if (i !== 0 && i % 8 === 0) str += "\n";

    // biome-ignore lint/style/useTemplate: <explanation>
    str += data.getUint8(i).toString(2).padStart(8, "0") + " ";
  }

  // Read raw report into groups of 8 bytes of hex
  str += "\n\n";
  for (let i = 0; i !== len; ++i) {
    if (i !== 0 && i % 8 === 0) str += "\n";

    // biome-ignore lint/style/useTemplate: <explanation>
    str += data.getUint8(i).toString(16).padStart(2, "0") + " ";
  }

  targetEl.innerText = `report:\n${str}`;
}

async function getDeviceInfo(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_DEVICE_INFO], true);
  return nextReportCommand(dev);
}

async function getStageConfig(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_CONFIG_V5], true);
  return process_packets(dev, true);
  //return nextReportCommand(dev);
}

const devices: Record<number, HIDDevice> = {};
const status = document.getElementById("status");

async function open_smx_device(dev: HIDDevice) {
  if (!dev.opened) {
    await dev.open();
  }
  // Get the device info an find the player number
  await send_data(dev, [API_COMMAND.GET_DEVICE_INFO]);
  process_packets(dev, true).then((packet) => {
    const device_info = new SMXDeviceInfo(packet);
    devices[device_info.player] = dev;
    if (status) {
      status.innerText += `status: device opened: ${dev.productName}:P${device_info.player}:${device_info.serial}\n`;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const output = document.getElementById("output");
  const btn = document.getElementById("btn");
  const btnp1 = document.getElementById("btnp1");

  if (!status || !output || !btn || !btnp1) {
    return;
  }

  if (!("hid" in navigator)) {
    status.innerText = "HID API not supported, use Google Chrome or MS Edge browsers for this tool";
    return;
  }

  const found_devices = await navigator.hid.getDevices();
  for (const device of found_devices) {
    console.log(`Found device: ${device.productName}`);
    await open_smx_device(device);
  }

  btn.addEventListener("click", async () => {
    const dev = await navigator.hid
      .requestDevice({
        filters: [{ vendorId: SMX_USB_VENDOR_ID, productId: SMX_USB_PRODUCT_ID }],
      })
      .then((devs) => devs[0]);

    if (!dev) {
      status.innerText = "no device selected";
      return;
    }

    await open_smx_device(dev);

    // add auto-updating UI responding to basic input reports
    // Commenting out for now.
    // document.body.prepend(new SimplePadElement(dev));
  });

  btnp1.addEventListener("click", async () => {
    getStageConfig(devices[1]).then((response) => {
      console.log("Raw Bytes: ", response);
      const smxconfig = new SMXConfig(response);
      console.log("Decoded Config:", smxconfig.config);

      // Right now I just want to confirm that decoding and re-encoding gives back the same data
      const encoded_config = smxconfig.encode();
      if (encoded_config) {
        console.log("Encoded Config:", smxconfig.config);
        const buf = new Uint8Array(encoded_config.buffer);
        console.log("Encoded Bytes: ", buf);
        console.log("Same Thing:", response.slice(2, -1).toString() === buf.toString());
      }
    });
  });
});
