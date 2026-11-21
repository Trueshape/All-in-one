import test from "node:test";
import assert from "node:assert/strict";
import { otherSide, sizeError } from "./imageSize";
import { MAX_SIDE } from "./imageOps";

const photo = { width: 4000, height: 3000 };

test("locked proportions give the other side, rounded", () => {
  assert.equal(otherSide("2000", "width", photo), "1500");
  assert.equal(otherSide("1500", "height", photo), "2000");
  assert.equal(otherSide("1001", "width", photo), "751"); // 750.75
});

test("an empty, zero or negative value gives nothing", () => {
  for (const v of ["", "0", "-5", "abc"]) assert.equal(otherSide(v, "width", photo), null);
});

test("size limits", () => {
  assert.equal(sizeError(800, 600, false), null);
  assert.match(sizeError(0, 600, false)!, /Dimensioni non valide/);
  assert.match(sizeError(NaN, 600, false)!, /Dimensioni non valide/);
  assert.equal(sizeError(MAX_SIDE, MAX_SIDE, false), null);
  assert.match(sizeError(MAX_SIDE + 1, 10, false)!, /Dimensioni non valide/);
});

test("ICO stops at 256 px", () => {
  assert.equal(sizeError(256, 256, true), null);
  assert.match(sizeError(257, 100, true)!, /ICO/);
  assert.equal(sizeError(257, 100, false), null);
});
