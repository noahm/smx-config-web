const encoder = new TextEncoder();

export function char2byte(c: string): number {
  return encoder.encode(c)[0];
}

export const API_COMMAND = {
  GET_DEVICE_INFO: char2byte("i"),
  GET_CONFIG: char2byte("g"),
  GET_CONFIG_V5: char2byte("G"),
  WRITE_CONFIG: char2byte("w"),
  WRITE_CONFIG_V5: char2byte("W"),
  FACTORY_RESET: char2byte("f"),
  SET_LIGHT_STRIP: char2byte("L"),
  FORCE_RECALIBRATION: char2byte("C"),
  GET_SENSOR_TEST_DATA: char2byte("y"),
  SET_SERIAL_NUMBERS: char2byte("s"),
  SET_PANEL_TEST_MODE: char2byte("t"),
};

export const SMX_USB_VENDOR_ID = 0x2341;
export const SMX_USB_PRODUCT_ID = 0x8037;
export const SMX_USB_PRODUCT_NAME = "StepManiaX";

export const PANEL_COUNT = 9;
export const SENSOR_COUNT = 4;

export enum Panel {
  UpLeft = 0,
  Up = 1,
  UpRight = 2,
  Left = 3,
  Center = 4,
  Right = 5,
  DownLeft = 6,
  Down = 7,
  DownRight = 8,
}

export enum FsrSensor {
  Left = 0,
  Right = 1,
  Up = 2,
  Down = 3,
}

export enum LoadCellSensor {
  NW = 0,
  NE = 1,
  SW = 2,
  SE = 3,
}
