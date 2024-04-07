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
