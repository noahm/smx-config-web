import type { ConfigShape } from "../../sdk/commands/config";

/**
 * Terse looping helper, 1 indexed
 * @param {number} n number of times to loop
 * @param {function} cb will be executed n times
 * @returns an array of the collected return values of cb
 */
export function times<T>(n: number, cb: (n: number) => T): T[] {
  const results = [];
  for (let i = 1; i <= n; i++) {
    results.push(cb(i));
  }
  return results;
}

/**
 * Same as `times` except zero-indexed
 */
export function timez<T>(n: number, cb: (n: number) => T): T[] {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(cb(i));
  }
  return results;
}

export function sensitivityLevelsForPanel(config: ConfigShape, panelIdx: number) {
  let highs: number[];
  let lows: number[];
  if (config.flags.PlatformFlags_FSR) {
    // TODO: break this down when some sensors have different values
    highs = config.panelSettings[panelIdx].fsrHighThreshold;
    lows = config.panelSettings[panelIdx].fsrLowThreshold;
  } else {
    const { loadCellHighThreshold, loadCellLowThreshold } = config.panelSettings[panelIdx];
    highs = new Array<number>(4).fill(loadCellHighThreshold);
    lows = new Array<number>(4).fill(loadCellLowThreshold);
  }
  return {
    lows,
    highs,
  };
}
