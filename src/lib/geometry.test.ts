import { test } from "node:test";
import assert from "node:assert/strict";
import { measure } from "./geometry";

test("square and rectangle", () => {
  assert.deepEqual(measure("square", { a: 4 }), { perimeter: 16, area: 16 });
  assert.deepEqual(measure("rectangle", { a: 6, b: 4 }), { perimeter: 20, area: 24 });
});

test("triangle 3-4-5 has area 6 and perimeter 12", () => {
  const r = measure("triangle", { a: 3, b: 4, c: 5 });
  assert.equal(r.perimeter, 12);
  assert.ok(Math.abs(r.area - 6) < 1e-9);
});

test("a triangle that cannot exist is reported", () => {
  assert.ok(measure("triangle", { a: 1, b: 2, c: 10 }).error);
});

test("cube, box, cylinder and sphere", () => {
  assert.deepEqual(measure("cube", { a: 3 }), { area: 54, volume: 27 });
  assert.deepEqual(measure("box", { a: 4, b: 3, c: 2 }), { area: 52, volume: 24 });
  const cyl = measure("cylinder", { r: 2, h: 5 });
  assert.ok(Math.abs(cyl.volume - 20 * Math.PI) < 1e-9);
  assert.ok(Math.abs(cyl.area - 2 * Math.PI * 2 * 7) < 1e-9);
  const sphere = measure("sphere", { r: 3 });
  assert.ok(Math.abs(sphere.volume - 36 * Math.PI) < 1e-9);
  assert.ok(Math.abs(sphere.area - 36 * Math.PI) < 1e-9);
});

test("2D shapes have no volume and solids have no perimeter", () => {
  assert.equal(measure("square", { a: 2 }).volume, undefined);
  assert.equal(measure("cube", { a: 2 }).perimeter, undefined);
});
