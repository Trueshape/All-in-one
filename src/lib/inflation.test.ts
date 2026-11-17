import assert from "node:assert/strict";
import test from "node:test";
import { CPI, adjust, yearRange } from "./inflation";

test("same year changes nothing", () => {
  const r = adjust("EUR", 100, 2015, 2015)!;
  assert.equal(r.value, 100);
  assert.equal(r.total, 0);
  assert.equal(r.yearly, null);
});

test("euro 2015 to 2025 follows the index ratio", () => {
  const r = adjust("EUR", 100, 2015, 2025)!;
  assert.ok(Math.abs(r.value - 128.75) < 1e-9);
  assert.ok(Math.abs(r.total - 28.75) < 1e-9);
  assert.ok(Math.abs(r.yearly! - (Math.pow(1.2875, 0.1) - 1) * 100) < 1e-9);
});

test("going back in time is the inverse", () => {
  const up = adjust("USD", 100, 2000, 2024)!;
  const down = adjust("USD", up.value, 2024, 2000)!;
  assert.ok(Math.abs(down.value - 100) < 1e-9);
  assert.ok(down.total < 0);
});

test("a year without data gives null and the ranges match the series", () => {
  assert.equal(adjust("EUR", 1, 1990, 2000), null);
  assert.deepEqual(yearRange("EUR"), { first: 1996, last: 2025 });
  assert.deepEqual(yearRange("USD"), { first: 1990, last: 2024 });
  assert.deepEqual(yearRange("JPY"), { first: 1990, last: 2025 });
});

test("every series has no gaps between its first and last year", () => {
  for (const c of ["EUR", "USD", "JPY"] as const) {
    const { first, last } = yearRange(c);
    for (let y = first; y <= last; y++) assert.ok(CPI[c][y] > 0, `${c} ${y}`);
  }
});
