import { test } from "node:test";
import assert from "node:assert/strict";
import { blockedNumberKey, keepAllowed, limitNumber, settleNumber } from "./inputGuards";

test("a number field refuses exponent letters and the plus sign", () => {
  for (const key of ["e", "E", "+"]) assert.equal(blockedNumberKey(key, {}), true);
  for (const key of ["0", "5", "-", ".", ",", "Backspace", "ArrowLeft"]) assert.equal(blockedNumberKey(key, {}), false);
});

test("the minus sign goes when the field cannot be below zero, the decimal marks when it holds whole numbers", () => {
  assert.equal(blockedNumberKey("-", { min: 0 }), true);
  assert.equal(blockedNumberKey("-", { min: 1 }), true);
  assert.equal(blockedNumberKey("-", { min: -273.15 }), false);
  assert.equal(blockedNumberKey(".", { integer: true }), true);
  assert.equal(blockedNumberKey(",", { integer: true }), true);
  assert.equal(blockedNumberKey(".", { decimals: 2 }), false);
});

test("typing is limited to the decimals and the maximum", () => {
  assert.equal(limitNumber("12.345", { decimals: 2 }), "12.34");
  assert.equal(limitNumber("12.3", { decimals: 2 }), "12.3");
  assert.equal(limitNumber("12.9", { decimals: 0 }), "12");
  assert.equal(limitNumber("12.9", { integer: true }), "12");
  assert.equal(limitNumber("150", { max: 100 }), "100");
  assert.equal(limitNumber("99.5", { max: 100 }), "99.5");
  assert.equal(limitNumber("", { max: 100 }), "");
});

test("pasted text with an exponent or a minus below zero is cleaned", () => {
  assert.equal(limitNumber("1e5", {}), "1");
  assert.equal(limitNumber("-5", { min: 0 }), "5");
  assert.equal(limitNumber("-5", { min: -10 }), "-5");
  assert.equal(limitNumber("-0.5", { min: 0, decimals: 1 }), "0.5");
});

test("a value below the minimum becomes the minimum when the field is left", () => {
  assert.equal(settleNumber("0", { min: 1 }), "1");
  assert.equal(settleNumber("-3", { min: 0 }), "0");
  assert.equal(settleNumber("5", { min: 1 }), "5");
  assert.equal(settleNumber("", { min: 1 }), "");
  assert.equal(settleNumber("-300", { min: -273.15 }), "-273.15");
});

test("only the allowed characters stay, up to the maximum length", () => {
  assert.equal(keepAllowed("IT35 O030-69", /[A-Za-z0-9 ]/, 42), "IT35 O03069");
  assert.equal(keepAllowed("abc123", /[0-9]/), "123");
  assert.equal(keepAllowed("12345", /[0-9]/, 4), "1234");
  assert.equal(keepAllowed("1-3, 5;x", /[0-9,;\- ]/), "1-3, 5;");
  assert.equal(keepAllowed("Zoë O'Neil-Smith 1", /[\p{L} '’-]/u), "Zoë O'Neil-Smith ");
});
