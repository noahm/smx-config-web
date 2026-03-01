import { atom, createStore } from "jotai";
import type { StageLike } from "../sdk/interface";
import { StageMock } from "../sdk/mock";
// import { atomFamily } from "jotai-family";
// import type { SMXStage } from "../sdk";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

/** atom family of all opened stages */
// export const stagesBySerial = atomFamily((_serial: string | undefined) => atom<SMXStage | undefined>(undefined));

export const activeLeftStage$ = atom<StageLike | null>(new StageMock(1));

export const activeRightStage$ = atom<StageLike | null>(new StageMock(2));

export const hasActiveStage$ = atom<boolean>((get) => {
  return !!get(activeLeftStage$) || !!get(activeRightStage$);
});

// TODO: make this a family per serial too? per side?
export const displayTestData$ = atom<"raw" | "calibrated" | "noise" | "tare" | "">("");
