import { atom, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { StageLike } from "../sdk/interface";
import type { CustomPreset } from "../sdk/custom-presets";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

/** user-saved custom presets, persisted to localStorage */
export const customPresets$ = atomWithStorage<CustomPreset[]>("smx.customPresets", []);

export const activeLeftStage$ = atom<StageLike | null>(null);

export const activeRightStage$ = atom<StageLike | null>(null);

export const unsupportedOpen$ = atom(!browserSupported);
