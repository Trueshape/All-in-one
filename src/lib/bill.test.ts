import test from "node:test";
import assert from "node:assert/strict";
import { splitBill } from "./bill";

test("no discount and no tip: the bill is split evenly", () => {
  assert.deepEqual(splitBill({ bill: 100, discount: { fixed: 0 }, tip: { fixed: 0 }, people: 4 }), { discountAmount: 0, tipAmount: 0, total: 100, perPerson: 25 });
});

test("a percentage tip is on the discounted bill", () => {
  const r = splitBill({ bill: 100, discount: { percent: 20 }, tip: { percent: 10 }, people: 1 });
  assert.equal(r.discountAmount, 20);
  assert.equal(r.tipAmount, 8);
  assert.equal(r.total, 88);
});

test("a fixed discount never exceeds the bill", () => {
  const r = splitBill({ bill: 30, discount: { fixed: 50 }, tip: { fixed: 0 }, people: 2 });
  assert.equal(r.discountAmount, 30);
  assert.equal(r.total, 0);
});

test("a fixed tip is added as it is", () => {
  const r = splitBill({ bill: 60, discount: { fixed: 10 }, tip: { fixed: 5 }, people: 3 });
  assert.equal(r.total, 55);
  assert.ok(Math.abs(r.perPerson - 55 / 3) < 1e-12);
});
