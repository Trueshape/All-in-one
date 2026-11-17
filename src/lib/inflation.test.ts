import assert from "node:assert/strict";
import test from "node:test";
import { CPI, adjust, yearRange } from "./inflation";

const CURRENCIES = ["EUR", "USD", "JPY", "ITL"] as const;

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
  const up = adjust("USD", 100, 1900, 2024)!;
  const down = adjust("USD", up.value, 2024, 1900)!;
  assert.ok(Math.abs(down.value - 100) < 1e-9);
  assert.ok(down.total < 0);
});

test("a year without data gives null and the ranges match the series", () => {
  assert.equal(adjust("EUR", 1, 1990, 2000), null);
  assert.deepEqual(yearRange("EUR"), { first: 1998, last: 2025 });
  assert.deepEqual(yearRange("USD"), { first: 1900, last: 2024 });
  assert.deepEqual(yearRange("JPY"), { first: 1900, last: 2025 });
  assert.deepEqual(yearRange("ITL"), { first: 1861, last: 2001 });
});

test("every series has no gaps between its first and last year", () => {
  for (const c of CURRENCIES) {
    const { first, last } = yearRange(c);
    for (let y = first; y <= last; y++) assert.ok(CPI[c][y] > 0, `${c} ${y}`);
  }
});

test("the lira follows the ISTAT index, 1913 = 1", () => {
  assert.equal(CPI.ITL[1913], 1);
  // ISTAT publishes 5831.714 for 2000: the table rounds to four significant figures
  assert.ok(Math.abs(CPI.ITL[2000] / 5831.714 - 1) < 1e-3);
});

test("the dollar and yen series join without a jump at 1990", () => {
  // the real US prices rose about 4% in 1990 -> 1991, Japan about 3%
  assert.ok(Math.abs(CPI.USD[1991] / CPI.USD[1990] - 1.042) < 0.005);
  assert.ok(Math.abs(CPI.JPY[1991] / CPI.JPY[1990] - 1.032) < 0.005);
  assert.ok(CPI.USD[1990] / CPI.USD[1989] < 1.07 && CPI.USD[1990] / CPI.USD[1989] > 1.04);
  assert.ok(CPI.JPY[1990] / CPI.JPY[1989] < 1.06 && CPI.JPY[1990] / CPI.JPY[1989] > 1.01);
});
