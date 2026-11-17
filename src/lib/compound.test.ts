import test from "node:test";
import assert from "node:assert/strict";
import { simulate } from "./compound";

test("monthly compounding of a lump sum matches the closed formula", () => {
  const r = simulate(1000, 0, 12, 1, 12);
  assert.ok(Math.abs(r.final - 1000 * 1.01 ** 12) < 1e-9);
  assert.equal(r.invested, 1000);
});

test("annual compounding adds the year's interest only at the year end", () => {
  assert.ok(Math.abs(simulate(1000, 0, 12, 1, 1).final - 1120) < 1e-9);
  // 11 months: interest is accrued but not yet capitalised, still counted in the final value
  assert.ok(Math.abs(simulate(1000, 0, 12, 11 / 12, 1).final - 1110) < 1e-9);
});

test("zero rate returns exactly what was paid in", () => {
  const r = simulate(500, 100, 0, 2, 12);
  assert.equal(r.invested, 500 + 24 * 100);
  assert.equal(r.final, r.invested);
  assert.equal(r.interest, 0);
});

test("zero years or an empty start gives nothing", () => {
  assert.deepEqual(simulate(1000, 50, 5, 0, 12), { invested: 1000, interest: 0, final: 1000 });
  assert.deepEqual(simulate(0, 0, 5, 10, 12), { invested: 0, interest: 0, final: 0 });
});

test("a longer or higher rate never gives less", () => {
  assert.ok(simulate(1000, 100, 5, 10, 12).final > simulate(1000, 100, 5, 9, 12).final);
  assert.ok(simulate(1000, 100, 6, 10, 12).final > simulate(1000, 100, 5, 10, 12).final);
});
