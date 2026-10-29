import { useEffect, useMemo, useReducer, useState } from "react";
import type { CSSProperties } from "react";
import { HelpCircle } from "lucide-react";
import { Button, Field, Panel, Segmented, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import type { Ui } from "../ui/tokens";
import { evaluate, formatResult, isOperator } from "../lib/calcEngine";
import type { UnaryFn } from "../lib/calcEngine";
import { INITIAL, reducer } from "../lib/calcState";

type Kind = "num" | "op" | "fn" | "pow" | "paren" | "dot" | "equal" | "clear" | "back";
type Mode = "scientific" | "simple";
type Shape = "square" | "soft" | "pill" | "round";
type Size = "small" | "medium" | "large";

interface Key {
  label: string;
  kind: Kind;
  value: string;
  x: number;
  y: number;
  /** Extra classes for symbols the mono font renders poorly (π looks like Π). */
  cls?: string;
}

const k = (label: string, kind: Kind, value: string, x: number, y: number, cls?: string): Key => ({ label, kind, value, x, y, cls });

// Scientific keypad: 7 × 5.
const SCIENTIFIC_KEYS: Key[] = [
  k("xʸ", "pow", "^", 2, 0), k("(", "paren", "(", 3, 0), k(")", "paren", ")", 4, 0), k("⌫", "back", "", 5, 0), k("C", "clear", "C", 6, 0),
  k("x²", "fn", "square", 0, 1), k("sin", "fn", "sin", 1, 1), k("√", "fn", "sqrt", 2, 1), k("7", "num", "7", 3, 1), k("8", "num", "8", 4, 1), k("9", "num", "9", 5, 1), k("÷", "op", "÷", 6, 1),
  k("1/x", "fn", "recip", 0, 2), k("cos", "fn", "cos", 1, 2), k("ln", "fn", "ln", 2, 2), k("4", "num", "4", 3, 2), k("5", "num", "5", 4, 2), k("6", "num", "6", 5, 2), k("×", "op", "×", 6, 2),
  k("±", "fn", "neg", 0, 3), k("tan", "fn", "tan", 1, 3), k("log", "fn", "log", 2, 3), k("1", "num", "1", 3, 3), k("2", "num", "2", 4, 3), k("3", "num", "3", 5, 3), k("−", "op", "-", 6, 3),
  k("π", "fn", "pi", 0, 4, "!text-xl !font-serif italic"), k("e", "fn", "e", 1, 4, "!text-base !font-serif italic"), k("%", "fn", "percent", 2, 4), k("0", "num", "0", 3, 4), k(".", "dot", ".", 4, 4), k("=", "equal", "=", 5, 4), k("+", "op", "+", 6, 4),
];

// Simple keypad: 4 × 5.
const SIMPLE_KEYS: Key[] = [
  k("⌫", "back", "", 0, 0), k("(", "paren", "(", 1, 0), k(")", "paren", ")", 2, 0), k("C", "clear", "C", 3, 0),
  k("7", "num", "7", 0, 1), k("8", "num", "8", 1, 1), k("9", "num", "9", 2, 1), k("÷", "op", "÷", 3, 1),
  k("4", "num", "4", 0, 2), k("5", "num", "5", 1, 2), k("6", "num", "6", 2, 2), k("×", "op", "×", 3, 2),
  k("1", "num", "1", 0, 3), k("2", "num", "2", 1, 3), k("3", "num", "3", 2, 3), k("−", "op", "-", 3, 3),
  k("0", "num", "0", 0, 4), k(".", "dot", ".", 1, 4), k("=", "equal", "=", 2, 4), k("+", "op", "+", 3, 4),
];

const GAP = 6;
const ROWS = 5;
const SCIENTIFIC_HEIGHT = 42;
const SIZES: Record<Size, { height: number; text: string }> = {
  small: { height: 40, text: "!text-sm" },
  medium: { height: 52, text: "!text-base" },
  large: { height: 68, text: "!text-xl" },
};
const RADIUS: Record<Shape, number> = { square: 4, soft: 12, pill: 9999, round: 9999 };

const MODE_KEY = "calc_mode";
const SHAPE_KEY = "calc_simple_shape";
const SIZE_KEY = "calc_simple_size";

function load<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved && (allowed as readonly string[]).includes(saved)) return saved as T;
  } catch {
    // storage unavailable
  }
  return fallback;
}

function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

/** `text` is the size class in simple mode; null keeps the scientific keypad's own sizes. */
function keyClass(u: Ui, kind: Kind, text: string | null): string {
  const base = cx(u.btnBase, u.btnSecondary, "w-full h-full select-none font-mono");
  switch (kind) {
    case "num":
    case "dot":
    case "op":
      return cx(base, text ?? "!text-sm", "font-bold", u.text);
    case "equal":
      return cx(base, text ?? "!text-sm", "font-bold", u.accent);
    case "clear":
      return cx(u.btnBase, u.btnDanger, "w-full h-full select-none font-mono font-bold", text);
    default:
      return cx(base, u.subtle, text);
  }
}

function keyStyle(kind: Kind, accentHex: string): CSSProperties {
  if (kind === "equal") return { background: `${accentHex}1f`, borderColor: `${accentHex}66` };
  if (kind === "clear") return { background: "#ef44441f" };
  if (kind === "num" || kind === "dot" || kind === "op") return { background: "#1c1c1e" };
  return { background: "#111112" };
}

export default function ScientificCalculator({ showSettings = false }: { showSettings?: boolean }) {
  const u = useUi();
  const [calc, dispatch] = useReducer(reducer, INITIAL);
  const [radians, setRadians] = useState(true);
  const [memory, setMemory] = useState(0);
  const [mode, setMode] = useState<Mode>(() => load("calc_mode", ["scientific", "simple"] as const, "scientific"));
  const [shape, setShape] = useState<Shape>(() => load(SHAPE_KEY, ["square", "soft", "pill", "round"] as const, "soft"));
  const [size, setSize] = useState<Size>(() => load(SIZE_KEY, ["small", "medium", "large"] as const, "medium"));

  useEffect(() => save(MODE_KEY, mode), [mode]);
  useEffect(() => save(SHAPE_KEY, shape), [shape]);
  useEffect(() => save(SIZE_KEY, size), [size]);

  const simple = mode === "simple";
  const keys = simple ? SIMPLE_KEYS : SCIENTIFIC_KEYS;
  const cols = simple ? 4 : 7;
  const cellHeight = simple ? SIZES[size].height : SCIENTIFIC_HEIGHT;
  const display = calc.error ?? calc.entry ?? "0";

  const preview = useMemo(() => {
    if (calc.error || !calc.tokens.some(isOperator)) return "";
    const tokens = [...calc.tokens];
    if (calc.entry !== null) tokens.push(calc.entry);
    while (tokens.length && (isOperator(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === "(")) tokens.pop();
    try { return formatResult(evaluate(tokens)); } catch { return ""; }
  }, [calc]);

  const press = (key: Key) => {
    switch (key.kind) {
      case "num": dispatch({ type: "digit", digit: key.value }); break;
      case "dot": dispatch({ type: "dot" }); break;
      case "op":
      case "pow": dispatch({ type: "operator", op: key.value }); break;
      case "paren": dispatch({ type: "paren", paren: key.value as "(" | ")" }); break;
      case "fn": dispatch({ type: "unary", fn: key.value as UnaryFn, radians }); break;
      case "equal": dispatch({ type: "equals" }); break;
      case "back": dispatch({ type: "backspace" }); break;
      case "clear": dispatch({ type: "clear" }); break;
    }
  };

  const memoryOp = (op: "MC" | "MR" | "M+" | "M-") => {
    const value = Number(calc.entry ?? "0");
    if (op === "MC") setMemory(0);
    else if (op === "MR") dispatch({ type: "recall", value: memory });
    else if (Number.isFinite(value)) setMemory((m) => m + (op === "M+" ? value : -value));
  };

  // Keyboard input (disabled while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key;
      const find = (pred: (x: Key) => boolean) => keys.find(pred);
      let found: Key | undefined;
      if (/^[0-9]$/.test(key)) found = find((x) => x.label === key);
      else if (key === "." || key === ",") found = find((x) => x.kind === "dot");
      else if (key === "+" || key === "-") found = find((x) => x.value === key);
      else if (key === "*" || key.toLowerCase() === "x") found = find((x) => x.value === "×");
      else if (key === "/" || key === ":") found = find((x) => x.value === "÷");
      else if (key === "^") found = find((x) => x.value === "^");
      else if (key === "(" || key === ")") found = find((x) => x.value === key);
      else if (key === "%") found = find((x) => x.value === "percent");
      else if (key === "Enter" || key === "=") found = find((x) => x.kind === "equal");
      else if (key === "Backspace") found = find((x) => x.kind === "back");
      else if (key === "Escape" || key.toLowerCase() === "c") found = find((x) => x.kind === "clear");
      if (found) { e.preventDefault(); press(found); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Stack className="space-y-4">
      <Segmented
        fill
        value={mode}
        onChange={setMode}
        options={[
          { value: "scientific", label: "Scientifica" },
          { value: "simple", label: "Semplice" },
        ]}
      />

      <Panel inset className="font-mono text-right select-none h-28 flex flex-col justify-between">
        <div className={cx("text-[11px] h-4 truncate", u.muted)} aria-label="Espressione">
          {calc.tokens.join(" ")} {memory !== 0 ? `[M = ${formatResult(memory)}]` : ""}
        </div>
        <div className={cx("text-3xl font-light truncate select-all", calc.error ? "text-red-400 !text-lg" : u.text)} role="status" aria-live="polite">{display}</div>
        <div className={cx("text-xs h-4", u.subtle)}>{preview ? `= ${preview}` : ""}</div>
      </Panel>

      {simple && showSettings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Forma">
            <Segmented
              fill
              value={shape}
              onChange={setShape}
              options={[
                { value: "square", label: "Quadrata" },
                { value: "soft", label: "Morbida" },
                { value: "pill", label: "Pillola" },
                { value: "round", label: "Tonda" },
              ]}
            />
          </Field>
          <Field label="Dimensione">
            <Segmented
              fill
              value={size}
              onChange={setSize}
              options={[
                { value: "small", label: "Piccola" },
                { value: "medium", label: "Media" },
                { value: "large", label: "Grande" },
              ]}
            />
          </Field>
        </div>
      )}

      {!simple && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {(["MC", "MR", "M+", "M-"] as const).map((op) => (
              <Button key={op} size="sm" className="px-2.5" onClick={() => memoryOp(op)}>{op}</Button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" className="px-2.5" variant={radians ? "primary" : "secondary"} onClick={() => setRadians(true)}>RAD</Button>
            <Button size="sm" className="px-2.5" variant={radians ? "secondary" : "primary"} onClick={() => setRadians(false)}>DEG</Button>
          </div>
        </div>
      )}

      <div className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, ${cellHeight}px)` }}>
        {keys.map((key) => (
          <button
            key={`${mode}-${key.label}`}
            type="button"
            onClick={() => press(key)}
            style={{
              gridColumn: key.x + 1,
              gridRow: key.y + 1,
              ...keyStyle(key.kind, u.accentHex),
              ...(key.cls ? { textTransform: "none" as const } : null),
              ...(simple ? { borderRadius: RADIUS[shape] } : null),
              ...(simple && shape === "round" ? { width: cellHeight, justifySelf: "center" } : null),
            }}
            className={cx(keyClass(u, key.kind, simple ? SIZES[size].text : null), key.cls)}
            aria-label={key.label}
          >
            {key.label}
          </button>
        ))}
      </div>

      {!simple && <p className={cx("flex items-center justify-center gap-1.5 text-[11px] text-center pt-2", u.muted)}>
        <HelpCircle className="w-3.5 h-3.5" /> Tastiera: cifre, + − * / ^ ( ), Invio (=), Backspace, Esc (C)
      </p>}
    </Stack>
  );
}
