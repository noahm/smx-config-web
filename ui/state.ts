import { atom, createStore } from "jotai";
import { atomFamily } from "jotai-family";
import type { SMXStage } from "../sdk";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

/** atom family of all opened stages */
export const stagesBySerial = atomFamily((_serial: string | undefined) => atom<SMXStage | undefined>(undefined));

export const activeLeftStageSerial$ = atom<string | undefined>(undefined);

export const activeRightStageSerial$ = atom<string | undefined>(undefined);

export const hasActiveStage$ = atom<boolean>((get) => {
  return !!get(activeLeftStageSerial$) || !!get(activeRightStageSerial$);
});

// TODO: make this a family per serial too? per side?
export const displayTestData$ = atom<"raw" | "calibrated" | "noise" | "tare" | "">("");
