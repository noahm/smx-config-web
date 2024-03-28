const encoder = new TextEncoder();

export const API_COMMAND = {
  GET_DEVICE_INFO: encoder.encode("i")[0],
  GET_CONFIG: encoder.encode("g")[0],
  GET_CONFIG_V5: encoder.encode("G")[0],
  WRITE_CONFIG: encoder.encode("w")[0],
  WRITE_CONFIG_V5: encoder.encode("W")[0],
  FACTORY_RESET: encoder.encode("f")[0],
  SET_LIGHT_STRIP: encoder.encode("L")[0],
  FORCE_RECALIBRATION: encoder.encode("C")[0],
  GET_SENSOR_TEST_DATA: encoder.encode("y")[0],
  SET_SERIAL_NUMBERS: encoder.encode("s")[0],
  SET_PANEL_TEST_MODE: encoder.encode("t")[0],
};

export const SMX_USB_VENDOR_ID = 0x2341;
export const SMX_USB_PRODUCT_ID = 0x8037;
export const SMX_USB_PRODUCT_NAME = "StepManiaX";
