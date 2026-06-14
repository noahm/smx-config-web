import type { ConfigShape } from "./commands/config";
import type { StageLike } from "./interface";

export const CUSTOM_PRESET_SCHEMA_VERSION = 1;

const SINGLE_FILE_TYPE = "smx-custom-preset";
const COLLECTION_FILE_TYPE = "smx-custom-preset-collection";

/**
 * A user-saved snapshot of a stage's full configuration, given a friendly name.
 * Presets are persisted locally and can be exported/imported as JSON to share.
 */
export interface CustomPreset {
  id: string;
  name: string;
  /** the full captured stage config */
  config: ConfigShape;
  /** firmware version of the stage the preset was captured from */
  firmwareVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** Envelope written when exporting a single preset to its own file. */
export interface CustomPresetFile {
  type: typeof SINGLE_FILE_TYPE;
  schemaVersion: number;
  preset: CustomPreset;
}

/** Envelope written when exporting the whole collection to one file. */
export interface CustomPresetCollectionFile {
  type: typeof COLLECTION_FILE_TYPE;
  schemaVersion: number;
  presets: CustomPreset[];
}

/** Thrown by {@link parsePresetImport} when a file can't be read as presets. */
export class PresetImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PresetImportError";
  }
}

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Capture the stage's current config into a new named preset.
 * The config is deep-cloned so later edits to the live stage don't mutate the preset.
 */
export function capturePreset(stage: StageLike, name: string): CustomPreset {
  if (!stage.config) throw new Error("Config not available to capture");
  const now = new Date().toISOString();
  return {
    id: newId(),
    name: name.trim() || "Untitled preset",
    config: structuredClone(stage.config),
    firmwareVersion: stage.info?.firmware_version ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Restore a preset to a connected stage and write it.
 *
 * Mirrors the mutate-then-write pattern of `applySensitivityPreset`: the preset's config
 * is deep-copied onto the live `stage.config` object (preserving its root identity so
 * `writeConfig` encodes it), while device/firmware-specific fields are preserved from the
 * live stage to keep presets portable across stages and firmware versions.
 */
export async function applyCustomPreset(stage: StageLike, preset: CustomPreset): Promise<ConfigShape> {
  const live = stage.config;
  if (!live) throw new Error("Config not available to restore onto");

  const merged = structuredClone(preset.config);
  // preserve device/firmware-specific fields from the live stage
  merged.masterVersion = live.masterVersion;
  merged.configVersion = live.configVersion;
  merged.padding = live.padding;

  Object.assign(live, merged);
  return stage.writeConfig();
}

export function serializeSingle(preset: CustomPreset): string {
  const file: CustomPresetFile = {
    type: SINGLE_FILE_TYPE,
    schemaVersion: CUSTOM_PRESET_SCHEMA_VERSION,
    preset,
  };
  return JSON.stringify(file, null, 2);
}

export function serializeCollection(presets: CustomPreset[]): string {
  const file: CustomPresetCollectionFile = {
    type: COLLECTION_FILE_TYPE,
    schemaVersion: CUSTOM_PRESET_SCHEMA_VERSION,
    presets,
  };
  return JSON.stringify(file, null, 2);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isArrayOfLength(value: unknown, length: number): boolean {
  return Array.isArray(value) && value.length === length;
}

/** Sanity-check that a parsed object looks like a full `ConfigShape`. */
function looksLikeConfig(config: unknown): config is ConfigShape {
  if (!isObject(config)) return false;
  return (
    isArrayOfLength(config.panelSettings, 9) &&
    isArrayOfLength(config.enabledSensors, 9) &&
    isArrayOfLength(config.stepColor, 9) &&
    isObject(config.flags)
  );
}

/**
 * Normalize a parsed object into a `CustomPreset`, filling in any missing metadata so
 * imported files are forgiving about exactly which fields they carry.
 */
function normalizePreset(raw: unknown): CustomPreset {
  if (!isObject(raw)) throw new PresetImportError("Preset is not an object");
  if (typeof raw.name !== "string" || !raw.name.trim()) {
    throw new PresetImportError("Preset is missing a name");
  }
  if (!looksLikeConfig(raw.config)) {
    throw new PresetImportError(`Preset "${raw.name}" has an invalid or missing config`);
  }
  const now = new Date().toISOString();
  return {
    id: typeof raw.id === "string" ? raw.id : newId(),
    name: raw.name,
    config: raw.config,
    firmwareVersion: typeof raw.firmwareVersion === "number" ? raw.firmwareVersion : 0,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

/**
 * Parse imported JSON into a list of presets, accepting either a single-preset file, a
 * collection file, or a bare preset object. Throws {@link PresetImportError} on anything
 * malformed or unsupported.
 */
export function parsePresetImport(json: string): CustomPreset[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new PresetImportError("File is not valid JSON");
  }

  if (!isObject(parsed)) throw new PresetImportError("Unrecognized preset file");

  if (typeof parsed.schemaVersion === "number" && parsed.schemaVersion > CUSTOM_PRESET_SCHEMA_VERSION) {
    throw new PresetImportError("Preset file was created by a newer version of this app");
  }

  if (parsed.type === COLLECTION_FILE_TYPE) {
    if (!Array.isArray(parsed.presets)) throw new PresetImportError("Collection file has no presets");
    return parsed.presets.map(normalizePreset);
  }

  if (parsed.type === SINGLE_FILE_TYPE) {
    return [normalizePreset(parsed.preset)];
  }

  // fallback: a bare preset object (e.g. hand-written or older export)
  return [normalizePreset(parsed)];
}

/**
 * Merge imported presets into the existing list. Incoming presets get fresh ids (to avoid
 * collisions across machines) and colliding names are suffixed so nothing is silently
 * overwritten.
 */
export function mergePresets(existing: CustomPreset[], incoming: CustomPreset[]): CustomPreset[] {
  const usedNames = new Set(existing.map((p) => p.name));
  const merged = [...existing];
  for (const preset of incoming) {
    let name = preset.name;
    if (usedNames.has(name)) {
      let suffix = 2;
      let candidate = `${preset.name} (imported)`;
      while (usedNames.has(candidate)) {
        candidate = `${preset.name} (imported ${suffix++})`;
      }
      name = candidate;
    }
    usedNames.add(name);
    merged.push({ ...preset, id: newId(), name });
  }
  return merged;
}
