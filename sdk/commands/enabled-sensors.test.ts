import { sbytes, sview } from "@nmann/struct-buffer";
import { expect, test, describe } from "vitest";
import { twoEnabledSensors_t, EnabledSensors } from "./enabled-sensors";

describe("twoEnabledSensors_t", () => {
  test("encode", () => {
    expect(twoEnabledSensors_t.decode(sbytes("0F"))).toEqual({
      up0: true,
      right0: true,
      down0: true,
      left0: true,
      up1: false,
      right1: false,
      down1: false,
      left1: false,
    });
    expect(twoEnabledSensors_t.decode(sbytes("F0"))).toEqual({
      up0: false,
      right0: false,
      down0: false,
      left0: false,
      up1: true,
      right1: true,
      down1: true,
      left1: true,
    });
  });
});

const enabledSensors = new EnabledSensors();

const decodedData = [
  {
    down: true,
    left: true,
    right: true,
    up: true,
  },
  {
    down: false,
    left: false,
    right: false,
    up: false,
  },
  {
    down: true,
    left: true,
    right: true,
    up: true,
  },
  {
    down: false,
    left: false,
    right: false,
    up: false,
  },
  {
    down: true,
    left: true,
    right: true,
    up: true,
  },
  {
    down: true,
    left: true,
    right: true,
    up: true,
  },
  {
    down: true,
    left: true,
    right: true,
    up: true,
  },
  {
    down: false,
    left: false,
    right: false,
    up: false,
  },
  {
    down: false,
    left: false,
    right: false,
    up: false,
  },
];

const encodedData = "0f 0f ff 0f 00";

test("decode", () => {
  expect(enabledSensors.decode(sbytes(encodedData))).toEqual(decodedData);
});

test("encode", () => {
  // this currently fails for reasons I don't quite understand. probably endianness or something
  expect(sview(enabledSensors.encode(decodedData, false))).toEqual(encodedData);
});
