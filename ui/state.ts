import { atom, createStore } from "jotai";
import type { SMXStage } from "../sdk";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

/** backing atom of all known stages */
export const stages$ = atom<Record<number, SMXStage | undefined>>({});

export const displayTestData$ = atom(false);

/** current p1 pad, derived from devices$ above */
export const p1Stage$ = atom<SMXStage | undefined, [SMXStage | undefined], void>(
  (get) => get(stages$)[1],
  (_, set, stage: SMXStage | undefined) => {
    set(stages$, (prev) => ({ ...prev, [1]: stage }));
  },
);

/** current p2 pad, derived from devices$ above */
export const p2Stage$ = atom<SMXStage | undefined, [SMXStage | undefined], void>(
  (get) => get(stages$)[2],
  (_, set, stage: SMXStage | undefined) => {
    set(stages$, (prev) => ({ ...prev, [2]: stage }));
  },
);

export const statusText$ = atom(
  browserSupported
    ? "no device connected"
    : "HID API not supported, use Google Chrome or MS Edge browsers for this tool",
);

/** write-only atom. write to this to append a line to statusText */
export const nextStatusTextLine$ = atom(null, (_, set, line: string) => set(statusText$, (prev) => `${prev}\n${line}`));
