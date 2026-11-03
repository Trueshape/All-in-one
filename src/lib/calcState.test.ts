import { test } from "node:test";
import assert from "node:assert/strict";
import { INITIAL, reducer } from "./calcState";
import type { Action, Calc } from "./calcState";

const digits = (text: string): Action[] => [...text].map((digit) => ({ type: "digit", digit }));
const run = (actions: Action[]): Calc => actions.reduce(reducer, INITIAL);
const fn = (name: "percent" | "sqrt"): Action => ({ type: "unary", fn: name, radians: true });

test("plain percent divides by 100", () => {
  assert.equal(run([...digits("50"), fn("percent")]).entry, "0.5");
});

test("200 + 10 % is 220: the percentage is taken on the left operand", () => {
  const state = run([...digits("200"), { type: "operator", op: "+" }, ...digits("10"), fn("percent"), { type: "equals" }]);
  assert.equal(state.entry, "220");
});

test("200 × 10 % keeps the plain meaning (200 × 0.1)", () => {
  const state = run([...digits("200"), { type: "operator", op: "×" }, ...digits("10"), fn("percent"), { type: "equals" }]);
  assert.equal(state.entry, "20");
});

test("a function with no number does nothing", () => {
  const state = run([...digits("5"), { type: "operator", op: "+" }, fn("sqrt"), { type: "equals" }]);
  assert.equal(state.entry, "5");
  assert.equal(state.error, null);
});

test("a function after a closed parenthesis does not break the expression", () => {
  const state = run([
    { type: "paren", paren: "(" },
    ...digits("2"),
    { type: "operator", op: "+" },
    ...digits("3"),
    { type: "paren", paren: ")" },
    fn("sqrt"),
    { type: "equals" },
  ]);
  assert.equal(state.entry, "5");
});

test("backspace removes the last typed digit", () => {
  assert.equal(run([...digits("123"), { type: "backspace" }]).entry, "12");
});
