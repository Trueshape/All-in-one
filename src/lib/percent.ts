/** The four everyday percentage questions. Each returns null when the question has no answer (empty input, or a division by zero). */

const ok = (n: number) => (Number.isFinite(n) ? n : null);

/** What is X% of Y */
export const percentOf = (x: number, y: number) => ok((x / 100) * y);

/** X is what percent of Y */
export const whatPercent = (x: number, y: number) => (y === 0 ? null : ok((x / y) * 100));

/** X is Y% of what */
export const wholeFrom = (x: number, y: number) => (y === 0 ? null : ok((x / y) * 100));

/** Change from one value to another, in percent of the starting value. */
export const percentChange = (from: number, to: number) => (from === 0 ? null : ok(((to - from) / Math.abs(from)) * 100));
