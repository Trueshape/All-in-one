import { test } from "node:test";
import assert from "node:assert/strict";
import { extractPalette, nearestIndex } from "./palette";

type Px = [number, number, number, number?];
const pixels = (...colors: Px[]) => new Uint8ClampedArray(colors.flatMap(([r, g, b, a = 255]) => [r, g, b, a]));
const repeat = (n: number, px: Px): Px[] => Array.from({ length: n }, () => px);

test("a two-colour image gives those two colours with their share", () => {
  const palette = extractPalette(pixels(...repeat(30, [255, 0, 0]), ...repeat(10, [0, 0, 255])), 4);
  assert.deepEqual(palette.map((c) => c.hex), ["#ff0000", "#0000ff"]);
  assert.equal(palette[0].share, 0.75);
});

test("transparent pixels are ignored", () => {
  const palette = extractPalette(pixels([255, 0, 0, 0], [0, 255, 0]), 3);
  assert.deepEqual(palette.map((c) => c.hex), ["#00ff00"]);
});

test("an empty image gives an empty palette", () => {
  assert.deepEqual(extractPalette(new Uint8ClampedArray(0), 5), []);
});

test("nearestIndex picks the closest colour", () => {
  assert.equal(nearestIndex([[0, 0, 0], [255, 255, 255]], [200, 200, 200]), 1);
});
