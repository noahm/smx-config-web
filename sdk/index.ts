/*
 * This file exports our public API to external consumers
 */

export {
  SMX_USB_PRODUCT_ID,
  SMX_USB_PRODUCT_NAME,
  SMX_USB_VENDOR_ID,
  FsrSensor,
  Panel,
  SENSOR_COUNT,
  PANEL_COUNT,
} from "./api.js";
export { type PanelName, type EachPanel } from "./commands/inputs.js";
export { SensorTestMode, type SMXPanelTestData, type SMXSensorTestData } from "./commands/sensor_test.js";
export { SMXStage } from "./smx.js";
