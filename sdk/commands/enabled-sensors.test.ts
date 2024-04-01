import { sbytes, sview } from "@nmann/struct-buffer";
import { expect, test } from "vitest";
import { EnabledSensors } from "./enabled-sensors";

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
