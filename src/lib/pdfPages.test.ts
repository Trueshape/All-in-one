import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkPages, groupLabel, marginsForRotation, markAnchors, moveItem, parsePageList, parseRangeGroups, piecesToLines } from "./pdfPages";

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

test("margins follow the page rotation", () => {
  const seen = { top: 1, right: 2, bottom: 3, left: 4 };
  assert.deepEqual(marginsForRotation(seen, 0), seen);
  assert.deepEqual(marginsForRotation(seen, 90), { left: 1, top: 2, right: 3, bottom: 4 });
  assert.deepEqual(marginsForRotation(seen, 180), { bottom: 1, left: 2, top: 3, right: 4 });
  assert.deepEqual(marginsForRotation(seen, 270), { right: 1, bottom: 2, left: 3, top: 4 });
  assert.deepEqual(marginsForRotation(seen, -90), marginsForRotation(seen, 270));
});

test("text pieces become lines from top to bottom", () => {
  const lines = piecesToLines([
    { str: "mondo", x: 60, y: 700, height: 12 },
    { str: "Ciao ", x: 10, y: 701, height: 12 },
    { str: "Seconda riga", x: 10, y: 680, height: 12 },
  ]);
  assert.deepEqual(lines, ["Ciao mondo", "Seconda riga"]);
});
