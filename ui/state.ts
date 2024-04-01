import { atom, createStore } from "jotai";

export const browserSupported = "hid" in navigator;

/** actually holds the state of each atom */
export const uiState = createStore();

/** backing atom of all known devices */
export const devices$ = atom<Record<number, HIDDevice | undefined>>({});

/** current p1 pad, derived from devices$ above */
export const p1Dev$ = atom<HIDDevice | undefined, [HIDDevice | undefined], void>(
  (get) => get(devices$)[1],
  (_, set, dev: HIDDevice | undefined) => {
    set(devices$, (prev) => ({ ...prev, [1]: dev }));
  },
);

/** current p2 pad, derived from devices$ above */
export const p2Dev$ = atom<HIDDevice | undefined, [HIDDevice | undefined], void>(
  (get) => get(devices$)[2],
  (_, set, dev: HIDDevice | undefined) => {
    set(devices$, (prev) => ({ ...prev, [2]: dev }));
  },
);

export const statusText$ = atom(
  browserSupported
    ? "no device connected"
    : "HID API not supported, use Google Chrome or MS Edge browsers for this tool",
);

/** write-only atom. write to this to append a line to statusText */
export const nextStatusTextLine$ = atom(null, (_, set, line: string) => set(statusText$, (prev) => `${prev}\n${line}`));
