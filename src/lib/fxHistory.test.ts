import assert from "node:assert/strict";
import test from "node:test";
import { PER_USD, historicalRate } from "./fxHistory";

test("the dollar is 1 in every year", () => {
  assert.equal(historicalRate("USD", "USD", 1950), 1);
  assert.equal(historicalRate("USD", "GBP", 1950), PER_USD.GBP[1950]);
});

test("cross rates go through the dollar", () => {
  // 1 GBP in yen = (yen per dollar) / (pounds per dollar)
  const r = historicalRate("GBP", "JPY", 1980)!;
  assert.ok(Math.abs(r - PER_USD.JPY[1980] / PER_USD.GBP[1980]) < 1e-9);
});

test("years outside a series give null", () => {
  assert.equal(historicalRate("EUR", "USD", 1990), null);
  assert.equal(historicalRate("CNY", "USD", 1950), null);
});

test("the euro is a number of euro per dollar, about 1.08 in 2000", () => {
  const r = historicalRate("USD", "EUR", 2000)!;
  assert.ok(r > 1.0 && r < 1.15, String(r));
});
