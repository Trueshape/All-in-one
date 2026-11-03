import { test } from "node:test";
import assert from "node:assert/strict";
import { adjust, sharpen } from "./imageOps";

test("adjust with all zeros leaves the pixels alone", () => {
  const data = new Uint8ClampedArray([10, 120, 250, 255]);
  adjust({ data }, { brightness: 0, contrast: 0, saturation: 0 });
  assert.deepEqual([...data], [10, 120, 250, 255]);
});

test("brightness raises every colour channel but not alpha", () => {
  const data = new Uint8ClampedArray([100, 100, 100, 200]);
  adjust({ data }, { brightness: 10, contrast: 0, saturation: 0 });
  assert.deepEqual([...data], [126, 126, 126, 200]);
});

test("saturation -100 turns a colour into grey", () => {
  const data = new Uint8ClampedArray([255, 0, 0, 255]);
  adjust({ data }, { brightness: 0, contrast: 0, saturation: -100 });
  assert.equal(data[0], data[1]);
  assert.equal(data[1], data[2]);
});

test("sharpen leaves a flat image unchanged and boosts an edge", () => {
  const flat = { width: 3, height: 3, data: new Uint8ClampedArray(36).fill(100) } as ImageData;
  sharpen(flat, 1);
  assert.ok([...flat.data].every((v) => v === 100));
  const edge = new Uint8ClampedArray(12);
  [50, 100, 150].forEach((v, i) => edge.set([v, v, v, 255], i * 4));
  const image = { width: 3, height: 1, data: edge } as ImageData;
  sharpen(image, 1);
  assert.ok(image.data[0] < 50 && image.data[8] > 150);
});
