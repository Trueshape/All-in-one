import { test } from "node:test";
import assert from "node:assert/strict";
import * as opentypeModule from "opentype.js";
import { ASCENT, CHARS, COLS, DESCENT, ROWS, cellArea, cyclingGsub, glyphFromMask, inkBox, maskToRects, otsu } from "./handwriting";

// Under Node the package is loaded as CommonJS, so its exports sit on `default`; bundlers give them directly.
const opentype: typeof opentypeModule = (opentypeModule as unknown as { default?: typeof opentypeModule }).default ?? opentypeModule;

test("the sheet has a cell for every character", () => {
  assert.ok(COLS * ROWS >= CHARS.length);
  assert.equal(new Set(CHARS).size, CHARS.length);
});

test("otsu separates dark ink from light paper", () => {
  const gray = new Uint8Array([...Array(50).fill(20), ...Array(50).fill(230)]);
  const t = otsu(gray);
  assert.ok(t >= 20 && t < 230);
});

test("inkBox finds the dark region, or null on a blank image", () => {
  const g = new Uint8Array(5 * 4).fill(255);
  g[1 * 5 + 2] = 0;
  g[2 * 5 + 3] = 0;
  assert.deepEqual(inkBox(g, 5, 4, 100), { x: 2, y: 1, w: 2, h: 2 });
  assert.equal(inkBox(new Uint8Array(20).fill(255), 5, 4, 100), null);
});

test("maskToRects merges equal runs on consecutive rows", () => {
  // 3 wide, 3 tall: a full block on the top two rows, a single pixel below.
  const mask = new Uint8Array([1, 1, 1, 1, 1, 1, 0, 1, 0]);
  assert.deepEqual(maskToRects(mask, 3, 3), [{ x: 0, y: 0, w: 3, h: 2 }, { x: 1, y: 2, w: 1, h: 1 }]);
});

test("cellArea stays inside its own cell, below the label", () => {
  const sheet = { x: 0, y: 0, w: 1000, h: 900 };
  const a = cellArea(COLS + 1, sheet);
  assert.ok(a.x > 100 && a.x + a.w < 200);
  assert.ok(a.y > 100 * 0.9 && a.y + a.h <= 200 * 0.9 + 90);
});

test("a glyph sits on the baseline and gets side bearings; an empty cell gives none", () => {
  const w = 10;
  const h = 100;
  const mask = new Uint8Array(w * h);
  for (let y = 10; y < 60; y++) for (let x = 2; x < 6; x++) mask[y * w + x] = 1;
  const g = glyphFromMask("I", mask, w, h);
  assert.ok(g);
  const top = Math.max(...g.rects.map((r) => r.y + r.h));
  const bottom = Math.min(...g.rects.map((r) => r.y));
  assert.ok(top <= ASCENT && bottom >= -DESCENT);
  assert.ok(g.advance > 4 * ((ASCENT + DESCENT) / h));
  assert.equal(glyphFromMask("I", new Uint8Array(w * h), w, h), null);
});

test("cyclingGsub is null without variants and has one rule per variant slot otherwise", () => {
  assert.equal(cyclingGsub([2, 3], []), null);
  assert.equal(cyclingGsub([2, 3], [[], []]), null);
  const one = cyclingGsub([2, 3], [[{ base: 2, alt: 4 }]]);
  assert.equal(one?.lookups.length, 2);
  assert.equal(one?.lookups[0].subtables.length, 1);
  const two = cyclingGsub([2, 3], [[{ base: 3, alt: 5 }, { base: 2, alt: 4 }], [{ base: 2, alt: 6 }]]);
  assert.equal(two?.lookups.length, 3);
  assert.equal(two?.lookups[0].subtables.length, 2);
  // single substitutions keep the coverage sorted and the replacements aligned with it
  assert.deepEqual(two?.lookups[1].subtables[0], { substFormat: 2, coverage: { format: 1, glyphs: [2, 3] }, substitute: [4, 5] });
  const four = cyclingGsub([2], [[{ base: 2, alt: 3 }], [{ base: 2, alt: 4 }], [{ base: 2, alt: 5 }], [{ base: 2, alt: 6 }]]);
  assert.equal(four?.lookups.length, 5);
  assert.equal(four?.lookups[0].subtables.length, 4);
});

test("a font with the calt table can be written and read back", () => {
  const glyph = (name: string, unicode: number | undefined, width: number) => {
    const path = new opentype.Path();
    path.moveTo(0, 0);
    path.lineTo(0, 100);
    path.lineTo(width, 100);
    path.lineTo(width, 0);
    path.close();
    return new opentype.Glyph({ name, unicode, advanceWidth: width + 100, path });
  };
  const glyphs = [
    new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 500, path: new opentype.Path() }),
    glyph("a", 97, 100),
    glyph("a.alt1", undefined, 200),
    glyph("a.alt2", undefined, 300),
  ];
  const font = new opentype.Font({ familyName: "Test", styleName: "Regular", unitsPerEm: 1000, ascender: 760, descender: -240, glyphs });
  (font.tables as Record<string, unknown>).gsub = cyclingGsub([1], [[{ base: 1, alt: 2 }], [{ base: 1, alt: 3 }]]);
  const back = opentype.parse(font.toArrayBuffer());
  const gsub = back.tables.gsub as { features: Array<{ tag: string }>; lookups: Array<{ lookupType: number; subtables: unknown[] }> };
  assert.equal(gsub.features[0].tag, "calt");
  assert.deepEqual(gsub.lookups.map((l) => l.lookupType), [6, 1, 1]);
  assert.equal(gsub.lookups[0].subtables.length, 2);
});
