import { describe, expect, test, vi } from "vitest";
import { fsrConfig } from "./mocks/config";
import type { ConfigShape } from "./commands/config";
import type { StageLike } from "./interface";
import {
  applyCustomPreset,
  capturePreset,
  CUSTOM_PRESET_SCHEMA_VERSION,
  type CustomPreset,
  mergePresets,
  parsePresetImport,
  PresetImportError,
  serializeCollection,
  serializeSingle,
} from "./custom-presets";

function fakeStage(config: ConfigShape | null, firmware = 5): StageLike & { writeConfig: ReturnType<typeof vi.fn> } {
  const stage = {
    config,
    info: config ? { serial: "test", firmware_version: firmware, player: 1 } : null,
    writeConfig: vi.fn(async () => stage.config as ConfigShape),
  } as unknown as StageLike & { writeConfig: ReturnType<typeof vi.fn> };
  return stage;
}

function makePreset(overrides: Partial<CustomPreset> = {}): CustomPreset {
  const now = new Date().toISOString();
  return {
    id: "preset-1",
    name: "My Preset",
    config: structuredClone(fsrConfig),
    firmwareVersion: 5,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("capturePreset", () => {
  test("captures an independent deep copy of the live config", () => {
    const live = structuredClone(fsrConfig);
    const stage = fakeStage(live);
    const preset = capturePreset(stage, "Tournament");

    expect(preset.name).toBe("Tournament");
    expect(preset.firmwareVersion).toBe(5);
    expect(preset.config).toEqual(fsrConfig);

    // mutating the live config afterwards must not change the stored preset
    live.panelSettings[0].loadCellHighThreshold = 200;
    expect(preset.config.panelSettings[0].loadCellHighThreshold).toBe(fsrConfig.panelSettings[0].loadCellHighThreshold);
  });

  test("throws when no config is available", () => {
    expect(() => capturePreset(fakeStage(null), "x")).toThrow();
  });
});

describe("applyCustomPreset", () => {
  test("mutates live config in place, preserves device fields, and writes", async () => {
    const live = structuredClone(fsrConfig);
    live.masterVersion = 99;
    live.configVersion = 42;
    live.padding = [1, 2, 3];
    const stage = fakeStage(live);

    const preset = makePreset();
    preset.config.panelSettings[0].loadCellHighThreshold = 123;
    preset.config.masterVersion = 7;
    preset.config.configVersion = 8;

    await applyCustomPreset(stage, preset);

    // root identity preserved (writeConfig encodes the same object)
    expect(stage.config).toBe(live);
    expect(live.panelSettings[0].loadCellHighThreshold).toBe(123);
    // device/firmware-specific fields preserved from the live stage
    expect(live.masterVersion).toBe(99);
    expect(live.configVersion).toBe(42);
    expect(live.padding).toEqual([1, 2, 3]);
    expect(stage.writeConfig).toHaveBeenCalledOnce();
  });

  test("does not alias back to the stored preset", async () => {
    const live = structuredClone(fsrConfig);
    const stage = fakeStage(live);
    const preset = makePreset();
    await applyCustomPreset(stage, preset);

    live.panelSettings[0].loadCellHighThreshold = 250;
    expect(preset.config.panelSettings[0].loadCellHighThreshold).not.toBe(250);
  });

  test("throws when no config is available", async () => {
    await expect(applyCustomPreset(fakeStage(null), makePreset())).rejects.toThrow();
  });
});

describe("serialize / parse round-trip", () => {
  test("single preset file round-trips", () => {
    const preset = makePreset();
    const parsed = parsePresetImport(serializeSingle(preset));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe(preset.name);
    expect(parsed[0].config).toEqual(preset.config);
  });

  test("collection file round-trips", () => {
    const presets = [makePreset({ id: "a", name: "A" }), makePreset({ id: "b", name: "B" })];
    const parsed = parsePresetImport(serializeCollection(presets));
    expect(parsed.map((p) => p.name)).toEqual(["A", "B"]);
  });

  test("accepts a bare preset object", () => {
    const bare = JSON.stringify({ name: "Bare", config: structuredClone(fsrConfig) });
    const parsed = parsePresetImport(bare);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("Bare");
    expect(typeof parsed[0].id).toBe("string");
  });
});

describe("parsePresetImport validation", () => {
  test("rejects malformed JSON", () => {
    expect(() => parsePresetImport("{not json")).toThrow(PresetImportError);
  });

  test("rejects a future schema version", () => {
    const future = JSON.stringify({
      type: "smx-custom-preset",
      schemaVersion: CUSTOM_PRESET_SCHEMA_VERSION + 1,
      preset: makePreset(),
    });
    expect(() => parsePresetImport(future)).toThrow(/newer version/);
  });

  test("rejects a preset with an invalid config", () => {
    const bad = JSON.stringify({ name: "Bad", config: { panelSettings: [] } });
    expect(() => parsePresetImport(bad)).toThrow(PresetImportError);
  });

  test("rejects a preset missing a name", () => {
    const bad = JSON.stringify({ config: structuredClone(fsrConfig) });
    expect(() => parsePresetImport(bad)).toThrow(PresetImportError);
  });
});

describe("mergePresets", () => {
  test("regenerates ids and resolves name collisions", () => {
    const existing = [makePreset({ id: "x", name: "Same" })];
    const incoming = [makePreset({ id: "x", name: "Same" })];
    const merged = mergePresets(existing, incoming);

    expect(merged).toHaveLength(2);
    expect(merged[1].id).not.toBe("x");
    expect(merged[1].name).toBe("Same (imported)");
    expect(merged[0].name).toBe("Same");
  });

  test("keeps non-colliding names as-is", () => {
    const merged = mergePresets([makePreset({ name: "One" })], [makePreset({ name: "Two" })]);
    expect(merged.map((p) => p.name)).toEqual(["One", "Two"]);
  });
});
