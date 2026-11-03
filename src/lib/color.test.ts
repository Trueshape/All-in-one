import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, harmonies, hexToRgb, mixRgb, rgbToHex } from "./color";

const byId = (hex: string, id: string) => harmonies(hex).find((h) => h.id === id)!.colors;

test("complementary of pure red is cyan", () => {
  assert.deepEqual(byId("#ff0000", "complementary"), ["#ff0000", "#00ffff"]);
});

test("triadic of pure red is green and blue", () => {
  assert.deepEqual(byId("#ff0000", "triadic"), ["#ff0000", "#00ff00", "#0000ff"]);
});

test("every harmony keeps the base colour, and the analogous one has it in the middle", () => {
  for (const h of harmonies("#3366cc")) assert.ok(h.colors.includes("#3366cc"), h.id);
  assert.equal(byId("#3366cc", "analogous")[1], "#3366cc");
  assert.equal(byId("#3366cc", "tetradic").length, 4);
});

test("each harmony knows its base colour and the hue offset of every colour", () => {
  for (const h of harmonies("#3366cc")) {
    assert.equal(h.colors[h.base], "#3366cc", h.id);
    assert.equal(h.offsets[h.base], 0, h.id);
    assert.equal(h.offsets.length, h.colors.length, h.id);
  }
});

test("accented analogous is the three neighbours plus the complement", () => {
  assert.deepEqual(byId("#ff0000", "accented"), ["#ff0080", "#ff0000", "#ff8000", "#00ffff"]);
});

test("there are eight harmonies", () => {
  assert.equal(harmonies("#ff0000").length, 8);
});

test("an invalid hex gives no harmonies", () => {
  assert.deepEqual(harmonies("nope"), []);
});

test("black on white has the maximum contrast", () => {
  assert.equal(Math.round(contrastRatio([0, 0, 0], [255, 255, 255])), 21);
});

test("mixing and hex conversion round-trip", () => {
  assert.equal(rgbToHex(mixRgb([0, 0, 0], [255, 255, 255], 0.5)), "#808080");
  assert.deepEqual(hexToRgb("#0a0b0c"), [10, 11, 12]);
});
