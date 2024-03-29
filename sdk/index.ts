import { API_COMMAND } from "./api";
import { process_packets, send_data } from "./packet";

export async function getDeviceInfo(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_DEVICE_INFO], true);
  return process_packets(dev, true);
}

export async function getStageConfig(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_CONFIG_V5], true);
  return process_packets(dev, true);
}
