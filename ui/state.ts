import { atom, createStore } from "jotai";
import type { SMXStage } from "../sdk";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

/** backing atom of all known stages */
export const stages$ = atom<Record<string, SMXStage>>({});

export const selectedStageSerial$ = atom<string | undefined>(undefined);

export const selectedStage$ = atom<SMXStage | undefined>((get) => {
  const serial = get(selectedStageSerial$);
  if (!serial) return;
  const stages = get(stages$);
  return stages[serial];
});

export const selectedPanelIdx$ = atom<number | undefined>();

export const displayTestData$ = atom<"raw" | "calibrated" | "noise" | "tare" | "">("");
