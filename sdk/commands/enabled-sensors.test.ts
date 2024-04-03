import { sbytes, sview } from "@nmann/struct-buffer";
import { expect, test, describe } from "vitest";
import { twoEnabledSensors_t, EnabledSensors } from "./enabled-sensors";
import { SENSOR_COUNT } from "../api";

describe("twoEnabledSensors_t", () => {
  test("encode", () => {
    expect(twoEnabledSensors_t.decode(sbytes("F0"), false)).toEqual({
      left0: true,
      right0: true,
      up0: true,
      down0: true,
      left1: false,
      right1: false,
      up1: false,
      down1: false,
    });

    expect(twoEnabledSensors_t.decode(sbytes("0F"))).toEqual({
      left0: false,
      right0: false,
      up0: false,
      down0: false,
      left1: true,
      right1: true,
      up1: true,
      down1: true,
    });
  });
});

const enabledSensors = new EnabledSensors();

const decodedData = [
  Array(SENSOR_COUNT).fill(false),
  Array(SENSOR_COUNT).fill(true),
  Array(SENSOR_COUNT).fill(false),
  Array(SENSOR_COUNT).fill(true),
  Array(SENSOR_COUNT).fill(true),
  Array(SENSOR_COUNT).fill(true),
  Array(SENSOR_COUNT).fill(false),
  Array(SENSOR_COUNT).fill(true),
  Array(SENSOR_COUNT).fill(false),
];

const encodedData = "0f 0f ff 0f 00";

test("decode", () => {
  expect(enabledSensors.decode(sbytes(encodedData))).toEqual(decodedData);
});

test("encode", () => {
  expect(sview(enabledSensors.encode(decodedData))).toEqual(encodedData);
});
