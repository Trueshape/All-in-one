/** Fills a Uint32Array with random values; the browser's secure generator by default. */
type Fill = (buf: Uint32Array) => void;
const secureFill: Fill = (buf) => void crypto.getRandomValues(buf);

/** A whole number from 0 to max - 1, with no modulo bias: values from the uneven top of the range are thrown away. */
export function randomInt(max: number, fill: Fill = secureFill): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do fill(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

/**
 * The wheel angle (degrees, always growing so it spins forward) that brings slice `winner` of `count` under the pointer at the top.
 * `offset` is 0..1: where inside the slice it stops, kept within the middle 80%.
 */
export function wheelAngle(current: number, winner: number, count: number, offset: number): number {
  const slice = 360 / count;
  const inside = (offset - 0.5) * slice * 0.8;
  const base = Math.ceil(current / 360) * 360;
  return base + 360 * 6 + (360 - (winner * slice + slice / 2 + inside));
}
