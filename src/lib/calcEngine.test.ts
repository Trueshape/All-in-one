import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, formatResult } from "./calcEngine";

test("multiplication binds tighter than addition", () => {
  assert.equal(evaluate(["2", "+", "3", "×", "4"]), 14);
});

test("exponentiation is right-associative", () => {
  assert.equal(evaluate(["2", "^", "3", "^", "2"]), 512);
});

test("open parentheses are closed automatically", () => {
  assert.equal(evaluate(["(", "2", "+", "3"]), 5);
});

test("division by zero is an error", () => {
  assert.throws(() => evaluate(["1", "÷", "0"]), /zero/);
});

test("a dangling operator is a syntax error", () => {
  assert.throws(() => evaluate(["1", "+"]), /Sintassi/);
});

test("floating-point noise is rounded away", () => {
  assert.equal(formatResult(0.1 + 0.2), "0.3");
  assert.equal(formatResult(-0), "0");
});
