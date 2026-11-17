import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_ZOOM, inkBounds, inkColour, ringBackground, chunkPages, clampView, groupLabel, groupText, markAnchors, moveItem, parsePageList, parseRangeGroups, piecesToLines, zoomAt } from "./pdfPages";

test("zooming keeps the point under the cursor in place", () => {
  const at = (v: { scale: number; x: number; y: number }, px: number, py: number) => [(px - v.x) / v.scale, (py - v.y) / v.scale];
  const start = { scale: 1, x: 0, y: 0 };
  const zoomed = zoomAt(start, 2, 300, 200, 600, 800);
  assert.equal(zoomed.scale, 2);
  assert.deepEqual(at(zoomed, 300, 200), at(start, 300, 200));
  const again = zoomAt(zoomed, 1.5, 120, 500, 600, 800);
  assert.ok(Math.abs(at(again, 120, 500)[0] - at(zoomed, 120, 500)[0]) < 1e-9);
});

test("the zoomed page always covers the frame, and zoom has limits", () => {
  const v = zoomAt({ scale: 1, x: 0, y: 0 }, 2, 0, 0, 600, 800);
  assert.deepEqual(v, { scale: 2, x: 0, y: 0 });
  assert.deepEqual(clampView({ scale: 2, x: 100, y: -5000 }, 600, 800), { scale: 2, x: 0, y: -800 });
  assert.equal(zoomAt(v, 0.1, 10, 10, 600, 800).scale, 1);
  assert.deepEqual(zoomAt({ scale: 1, x: 0, y: 0 }, 0.5, 300, 400, 600, 800), { scale: 1, x: 0, y: 0 });
  assert.equal(zoomAt({ scale: MAX_ZOOM, x: 0, y: 0 }, 3, 10, 10, 600, 800).scale, MAX_ZOOM);
});

test("fields a little apart stay separate boxes, words a normal space apart join", () => {
  const size = 10;
  const row = (gap: number) => groupText([
    { str: "Nome", x: 20, y: 50, width: 24, size },
    { str: "Rossi", x: 44 + gap, y: 50, width: 26, size },
  ]).map((b) => b.text);
  assert.deepEqual(row(3), ["Nome Rossi"]);
  assert.deepEqual(row(6), ["Nome", "Rossi"]);
  assert.deepEqual(row(12), ["Nome", "Rossi"]);
});

test("blank pieces as wide as the gap do not glue separate fields together", () => {
  const boxes = groupText([
    { str: "Nome:", x: 60, y: 142, width: 35, size: 12 },
    { str: " ", x: 95, y: 142, width: 35, size: 12 },
    { str: "Mario", x: 130, y: 142, width: 30, size: 12 },
    { str: "Totale", x: 60, y: 202, width: 33, size: 12 },
    { str: " ", x: 93, y: 202, width: 3.4, size: 12 },
    { str: "netto", x: 96.4, y: 202, width: 28, size: 12 },
  ]);
  assert.deepEqual(boxes.map((b) => b.text), ["Nome:", "Mario", "Totale netto"]);
});

test("text pieces on one baseline join, wide gaps and other lines split", () => {
  const boxes = groupText([
    { str: "Ciao", x: 10, y: 100, width: 24, size: 12 },
    { str: "mondo", x: 37.5, y: 100.4, width: 30, size: 12 },
    { str: "Colonna due", x: 300, y: 100, width: 66, size: 12 },
    { str: "Sotto", x: 10, y: 120, width: 28, size: 12 },
    { str: " ", x: 50, y: 120, width: 3, size: 12 },
  ]);
  assert.deepEqual(boxes.map((b) => b.text), ["Ciao mondo", "Colonna due", "Sotto"]);
  assert.equal(boxes[0].width, 57.5);
  assert.equal(boxes[2].y, 120);
});

test("a centred mark has its middle at the page centre, also when turned", () => {
  const box = { x: 0, y: 0, width: 600, height: 800 };
  assert.deepEqual(markAnchors(box, 200, 40, 0, "center"), [{ x: 200, y: 380 }]);
  const [turned] = markAnchors(box, 200, 40, 90, "center");
  assert.ok(Math.abs(turned.x - 320) < 1e-9 && Math.abs(turned.y - 300) < 1e-9);
});

test("a tiled mark covers the page with several copies, but not too many", () => {
  const box = { x: 0, y: 0, width: 600, height: 800 };
  const marks = markAnchors(box, 120, 20, 45, "tile");
  assert.ok(marks.length > 6 && marks.length <= 400);
  assert.ok(markAnchors(box, 1, 1, 0, "tile").length <= 400);
});

test("page ranges become 0-based groups", () => {
  assert.deepEqual(parseRangeGroups("1-3, 5", 10), [[0, 1, 2], [4]]);
  assert.deepEqual(parseRangeGroups(" 2 ;4-4 ", 5), [[1], [3]]);
});

test("page ranges outside the PDF or written badly give a message", () => {
  assert.equal(typeof parseRangeGroups("", 5), "string");
  assert.equal(typeof parseRangeGroups("0", 5), "string");
  assert.equal(typeof parseRangeGroups("4-9", 5), "string");
  assert.equal(typeof parseRangeGroups("3-1", 5), "string");
  assert.equal(typeof parseRangeGroups("a", 5), "string");
});

test("a page list is sorted and has no repeats", () => {
  assert.deepEqual(parsePageList("5, 1-2, 2", 6), [0, 1, 4]);
});

test("chunks keep the order and a shorter last group", () => {
  assert.deepEqual(chunkPages(5, 2), [[0, 1], [2, 3], [4]]);
  assert.equal(groupLabel([2]), "Pagina 3");
  assert.equal(groupLabel([0, 1, 2]), "Pagine 1–3");
});

test("moveItem moves one item and keeps the others in order", () => {
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 3, 0), ["d", "a", "b", "c"]);
});

test("text pieces become lines from top to bottom", () => {
  const lines = piecesToLines([
    { str: "mondo", x: 60, y: 700, height: 12 },
    { str: "Ciao ", x: 10, y: 701, height: 12 },
    { str: "Seconda riga", x: 10, y: 680, height: 12 },
  ]);
  assert.deepEqual(lines, ["Ciao mondo", "Seconda riga"]);
});

test("the background is the colour that surrounds the box, even with text or a picture on the ring", () => {
  const w = 40;
  const h = 20;
  const img = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) img.set([200, 230, 255, 255], i * 4);
  // dark text inside the box
  for (let y = 7; y < 13; y++) for (let x = 12; x < 28; x++) img.set([10, 10, 10, 255], (y * w + x) * 4);
  // a dark letter of the next word touching the ring on the right
  for (let y = 6; y < 9; y++) for (let x = 31; x < 33; x++) img.set([0, 0, 0, 255], (y * w + x) * 4);
  assert.equal(ringBackground(img, w, h, { x: 10, y: 5, w: 20, h: 10 }), "#c8e6ff");
  assert.equal(ringBackground(new Uint8ClampedArray(4 * 4 * 4).fill(255), 4, 4, { x: 1, y: 1, w: 1, h: 1 }), "#ffffff");
  assert.equal(ringBackground(new Uint8ClampedArray(16), 2, 2, { x: 50, y: 50, w: 1, h: 1 }), "#ffffff");
});

test("the ink colour is the pixel that differs most from the background", () => {
  const w = 20;
  const h = 10;
  const img = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) img.set([255, 255, 255, 255], i * 4);
  img.set([120, 120, 120, 255], (4 * w + 6) * 4);
  img.set([200, 0, 0, 255], (5 * w + 7) * 4);
  assert.equal(inkColour(img, w, h, { x: 2, y: 2, w: 14, h: 6 }, "#ffffff"), "#c80000");
  assert.equal(inkColour(img, w, h, { x: 15, y: 0, w: 3, h: 3 }, "#ffffff"), "#ffffff");
});

test("the ink box hugs the letters and leaves out an underline or a border", () => {
  const w = 60;
  const h = 30;
  const img = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) img.set([255, 255, 255, 255], i * 4);
  const dark = (x: number, y: number) => img.set([0, 0, 0, 255], (y * w + x) * 4);
  for (let y = 10; y < 18; y++) for (let x = 12; x < 40; x += 2) dark(x, y);
  // a rule right under the text, across the whole band
  for (let x = 0; x < w; x++) dark(x, 21);
  const band = { x: 4, y: 5, w: 50, h: 17 };
  assert.deepEqual(inkBounds(img, w, h, band, "#ffffff"), { x0: 12, y0: 10, x1: 39, y1: 18 });
  assert.equal(inkBounds(img, w, h, { x: 44, y: 0, w: 10, h: 8 }, "#ffffff"), null);
});
