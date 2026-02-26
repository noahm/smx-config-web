import { expect, test } from "vitest";
import { smx_config_t } from "./config";

test("struct size", () => {
  const output = smx_config_t.encode({});
  expect(output.byteLength).toBe(250);
  expect(smx_config_t.byteLength).toBe(250);
});
