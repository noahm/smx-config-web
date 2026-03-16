import { atom, createStore } from "jotai";
import type { StageLike } from "../sdk/interface";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

export const activeLeftStage$ = atom<StageLike | null>(null);

export const activeRightStage$ = atom<StageLike | null>(null);

// export const hasActiveStage$ = atom<boolean>((get) => {
//   return !!get(activeLeftStage$) || !!get(activeRightStage$);
// });
