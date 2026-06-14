import { useAtom } from "jotai";
import { useCallback } from "react";
import { notifications } from "@mantine/notifications";
import {
  applyCustomPreset,
  capturePreset,
  type CustomPreset,
  mergePresets,
  parsePresetImport,
  PresetImportError,
  serializeCollection,
  serializeSingle,
} from "../../sdk/custom-presets";
import type { StageLike } from "../../sdk/interface";
import { customPresets$ } from "../state";
import { downloadJson, presetFilenameStem, readJsonFile } from "../custom-presets-download";

export function useCustomPresets() {
  const [presets, setPresets] = useAtom(customPresets$);

  const save = useCallback(
    (stage: StageLike, name: string) => {
      const preset = capturePreset(stage, name);
      setPresets((prev) => [...prev, preset]);
      notifications.show({ message: `Saved preset “${preset.name}”` });
    },
    [setPresets],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPresets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed, updatedAt: new Date().toISOString() } : p)),
      );
    },
    [setPresets],
  );

  const remove = useCallback(
    (id: string) => {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    },
    [setPresets],
  );

  const apply = useCallback(async (stage: StageLike, preset: CustomPreset) => {
    if (stage.info && preset.firmwareVersion && preset.firmwareVersion !== stage.info.firmware_version) {
      notifications.show({
        color: "yellow",
        message: `Preset was saved from firmware v${preset.firmwareVersion}, applying to v${stage.info.firmware_version}`,
      });
    }
    try {
      await applyCustomPreset(stage, preset);
      notifications.show({ message: `Applied preset “${preset.name}”` });
    } catch (err) {
      console.error(err);
      notifications.show({
        color: "red",
        message: `Failed to apply preset: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }, []);

  const exportOne = useCallback((preset: CustomPreset) => {
    downloadJson(`smx-preset-${presetFilenameStem(preset.name)}.json`, serializeSingle(preset));
  }, []);

  const exportAll = useCallback(() => {
    downloadJson("smx-presets.json", serializeCollection(presets));
  }, [presets]);

  const importFromFile = useCallback(
    async (file: File): Promise<number> => {
      try {
        const incoming = parsePresetImport(await readJsonFile(file));
        setPresets((prev) => mergePresets(prev, incoming));
        notifications.show({
          message: `Imported ${incoming.length} preset${incoming.length === 1 ? "" : "s"}`,
        });
        return incoming.length;
      } catch (err) {
        const message = err instanceof PresetImportError ? err.message : "Could not import presets";
        notifications.show({ color: "red", message });
        return 0;
      }
    },
    [setPresets],
  );

  return { presets, save, rename, remove, apply, exportOne, exportAll, importFromFile };
}
