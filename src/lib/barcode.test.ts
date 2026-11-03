import { test } from "node:test";
import assert from "node:assert/strict";
import { CODE128, code128Checksum, ean13CheckDigit, encodeBarcode } from "./barcode";

test("EAN-13 check digit of a known code", () => {
  assert.equal(ean13CheckDigit("400638133393"), 1);
});

test("EAN-13 has 95 modules and starts and ends with a guard", () => {
  const result = encodeBarcode("ean13", "4006381333931");
  assert.ok("modules" in result);
  assert.equal(result.modules.length, 95);
  assert.deepEqual(result.modules.slice(0, 3), [1, 0, 1]);
  assert.deepEqual(result.modules.slice(-3), [1, 0, 1]);
});

test("EAN-13 adds the missing check digit and rejects a wrong one", () => {
  const added = encodeBarcode("ean13", "400638133393");
  assert.ok("label" in added);
  assert.equal(added.label, "4006381333931");
  assert.ok("error" in encodeBarcode("ean13", "4006381333930"));
  assert.ok("error" in encodeBarcode("ean13", "123"));
});

test("Code 128: every symbol is 11 modules wide and the stop is 13", () => {
  const result = encodeBarcode("code128", "Hello 123");
  assert.ok("modules" in result);
  // start + 9 characters + checksum = 11 symbols of 11 modules, then the 13-module stop
  assert.equal(result.modules.length, 11 * 11 + 13);
  assert.deepEqual(result.modules.slice(0, 11), [1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0]); // start B = 211214
});

test("Code 128 checksum", () => {
  assert.equal(code128Checksum("A"), 34);
});

test("Code 128 rejects characters it cannot encode", () => {
  assert.ok("error" in encodeBarcode("code128", "caffè"));
  assert.ok("error" in encodeBarcode("code128", ""));
});

test("the Code 128 table is consistent: 107 distinct symbols, 11 modules each, even bar width", () => {
  assert.equal(CODE128.length, 107);
  assert.equal(new Set(CODE128).size, 107);
  CODE128.forEach((widths, value) => {
    const digits = [...widths].map(Number);
    assert.equal(digits.reduce((a, b) => a + b, 0), value === 106 ? 13 : 11, `symbol ${value}`);
    const bars = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    assert.equal(bars % 2, 0, `symbol ${value} bar width`);
  });
});
