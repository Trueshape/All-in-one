import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTime } from "./timeInput";

test("minutes and mm:ss", () => {
  assert.equal(parseTime("25"), 1500);
  assert.equal(parseTime("12:30"), 750);
  assert.equal(parseTime(" 0:45 "), 45);
  assert.equal(parseTime("5:5"), 305);
});

test("unusable text is rejected", () => {
  for (const bad of ["", "abc", "0", "00:00", "1:75", "-5", "1000", "12:30:10"]) assert.equal(parseTime(bad), null, bad);
});
