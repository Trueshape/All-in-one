/** State machine of the scientific calculator keypad (digits, operators, parentheses, functions, memory recall). */

import { applyUnary, evaluate, formatResult, isOperator } from "./calcEngine";
import type { UnaryFn } from "./calcEngine";

export interface Calc {
  tokens: string[];
  /** Number being typed (or the last computed value); null when waiting for a number. */
  entry: string | null;
  error: string | null;
  /** The entry is the result of "=": the next digit starts a brand-new calculation. */
  fresh: boolean;
  /** The entry came from a function (sin, √, …): the next digit replaces it but keeps the expression. */
  computed: boolean;
}

export const INITIAL: Calc = { tokens: [], entry: null, error: null, fresh: false, computed: false };

export type Action =
  | { type: "digit"; digit: string }
  | { type: "dot" }
  | { type: "operator"; op: string }
  | { type: "paren"; paren: "(" | ")" }
  | { type: "unary"; fn: UnaryFn; radians: boolean }
  | { type: "equals" }
  | { type: "backspace" }
  | { type: "clear" }
  | { type: "recall"; value: number };

const openCount = (tokens: string[]) => tokens.filter((t) => t === "(").length - tokens.filter((t) => t === ")").length;

export function reducer(s: Calc, a: Action): Calc {
  switch (a.type) {
    case "digit": {
      if (s.error || s.fresh) return { ...INITIAL, entry: a.digit };
      if (s.computed) return { ...s, entry: a.digit, computed: false };
      const cur = s.entry ?? "";
      if (cur === "0") return { ...s, entry: a.digit };
      if (cur === "-0") return { ...s, entry: `-${a.digit}` };
      if (cur.replace(/[-.]/g, "").length >= 15) return s;
      return { ...s, entry: cur + a.digit };
    }
    case "dot": {
      const base = s.error || s.fresh ? INITIAL : s.computed ? { ...s, entry: null, computed: false } : s;
      const cur = base.entry ?? "0";
      return cur.includes(".") ? base : { ...base, entry: `${cur}.` };
    }
    case "operator": {
      if (s.error) return s;
      const tokens = [...s.tokens];
      if (s.entry !== null) tokens.push(s.entry);
      else if (!tokens.length) tokens.push("0");
      const last = tokens[tokens.length - 1];
      if (last === "(") return { ...s, tokens };
      if (isOperator(last)) tokens[tokens.length - 1] = a.op;
      else tokens.push(a.op);
      return { tokens, entry: null, error: null, fresh: false, computed: false };
    }
    case "paren": {
      const base = s.error ? INITIAL : s;
      const tokens = [...base.tokens];
      if (a.paren === "(") {
        if (base.entry !== null) tokens.push(base.entry, "×", "(");
        else if (tokens[tokens.length - 1] === ")") tokens.push("×", "(");
        else tokens.push("(");
        return { tokens, entry: null, error: null, fresh: false, computed: false };
      }
      if (openCount(tokens) <= 0) return base;
      if (base.entry !== null) tokens.push(base.entry);
      else if (!tokens.length || isOperator(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === "(") return base;
      tokens.push(")");
      return { tokens, entry: null, error: null, fresh: false, computed: false };
    }
    case "unary": {
      if (s.error) return s;
      try {
        const input = s.entry ?? (a.fn === "neg" ? "-0" : "0");
        if (a.fn === "neg" && s.entry === null) return { ...s, entry: "-0" };
        const value = applyUnary(a.fn, Number(input), a.radians);
        return { ...s, entry: formatResult(value), computed: true };
      } catch (err) {
        return { ...INITIAL, error: (err as Error).message };
      }
    }
    case "equals": {
      if (s.error) return INITIAL;
      const tokens = [...s.tokens];
      if (s.entry !== null) tokens.push(s.entry);
      while (tokens.length && (isOperator(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === "(")) tokens.pop();
      if (!tokens.length) return s;
      try {
        return { tokens: [], entry: formatResult(evaluate(tokens)), error: null, fresh: true, computed: true };
      } catch (err) {
        return { ...INITIAL, error: (err as Error).message };
      }
    }
    case "backspace": {
      if (s.error) return INITIAL;
      if (s.entry !== null) {
        const next = s.entry.slice(0, -1);
        return { ...s, entry: next === "" || next === "-" ? null : next, fresh: false, computed: false };
      }
      return { ...s, tokens: s.tokens.slice(0, -1) };
    }
    case "clear":
      return INITIAL;
    case "recall":
      return { ...(s.error ? INITIAL : s), entry: formatResult(a.value), computed: true, error: null };
  }
}
