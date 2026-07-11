import { test } from "vitest";
import { smx_config_t } from "./config";

test("struct size", (t) => {
  t.expect(smx_config_t.byteLength).toBe(250);
});
