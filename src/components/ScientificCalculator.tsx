import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { HelpCircle, RotateCcw, ArrowDownAZ, EyeOff } from "lucide-react";
import { Segmented, Button, Panel, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import type { Ui } from "../ui/tokens";
import { applyUnary, evaluate, formatResult, isOperator } from "../lib/calcEngine";
import type { UnaryFn } from "../lib/calcEngine";
import { autoLayout, defaultLayout, emptyCells, moveButton, normalize, resizeButton, rowCount, showButton, swapButtons } from "../lib/calcLayout";
import type { ButtonType, CalcButton } from "../lib/calcLayout";

const LAYOUT_KEY = "calc_button_layout_v4";
const SIZE_KEY = "calc_global_button_size";
type Size = "small" | "medium" | "large";

const HEIGHTS: Record<Size, number> = { small: 32, medium: 42, large: 52 };
const GAP = 6;

// ---------------------------------------------------------------- calculator state

interface Calc {
  tokens: string[];
  /** Number being typed (or the last computed value); null when waiting for a number. */
  entry: string | null;
  error: string | null;
  /** The entry is the result of "=": the next digit starts a brand-new calculation. */
  fresh: boolean;
  /** The entry came from a function (sin, √, …): the next digit replaces it but keeps the expression. */
  computed: boolean;
}

const INITIAL: Calc = { tokens: [], entry: null, error: null, fresh: false, computed: false };

type Action =
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

function reducer(s: Calc, a: Action): Calc {
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

// ---------------------------------------------------------------- component

function loadLayout(): CalcButton[] {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    if (saved) return normalize(JSON.parse(saved));
  } catch {
    // ignore corrupted data
  }
  return defaultLayout();
}

function loadSize(): Size {
  try {
    const saved = localStorage.getItem(SIZE_KEY);
    if (saved === "small" || saved === "medium" || saved === "large") return saved;
  } catch {
    // ignore
  }
  return "medium";
}

function keyClass(u: Ui, type: ButtonType): string {
  const base = cx(u.btnBase, u.btnSecondary, "w-full h-full select-none font-mono");
  switch (type) {
    case "num":
    case "dot":
      return cx(base, "!text-sm font-bold", u.text);
    case "equal":
      return cx(u.btnBase, u.btnPrimary, "w-full h-full select-none font-mono !text-sm font-bold");
    case "clear":
      return cx(u.btnBase, u.btnDanger, "w-full h-full select-none font-mono font-bold");
    case "operator":
      return cx(base, "!text-sm font-bold", u.accent);
    default:
      return cx(base, u.subtle);
  }
}

export default function ScientificCalculator({ isEditorMode = false }: { isEditorMode?: boolean }) {
  const u = useUi();
  const [calc, dispatch] = useReducer(reducer, INITIAL);
  const [radians, setRadians] = useState(true);
  const [memory, setMemory] = useState(0);
  const [buttons, setButtons] = useState<CalcButton[]>(loadLayout);
  const [size, setSize] = useState<Size>(loadSize);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(buttons)); } catch { /* storage unavailable */ }
  }, [buttons]);
  useEffect(() => {
    try { localStorage.setItem(SIZE_KEY, size); } catch { /* storage unavailable */ }
  }, [size]);
  useEffect(() => { if (!isEditorMode) { setSelected(null); setNotice(null); } }, [isEditorMode]);

  const display = calc.error ?? calc.entry ?? "0";

  const preview = useMemo(() => {
    if (calc.error || !calc.tokens.some(isOperator)) return "";
    const tokens = [...calc.tokens];
    if (calc.entry !== null) tokens.push(calc.entry);
    while (tokens.length && (isOperator(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === "(")) tokens.pop();
    try { return formatResult(evaluate(tokens)); } catch { return ""; }
  }, [calc]);

  const press = useCallback((btn: Pick<CalcButton, "type" | "value">) => {
    switch (btn.type) {
      case "num": dispatch({ type: "digit", digit: btn.value }); break;
      case "dot": dispatch({ type: "dot" }); break;
      case "operator": dispatch({ type: "operator", op: btn.value }); break;
      case "parenthesis": dispatch({ type: "paren", paren: btn.value as "(" | ")" }); break;
      case "unary": dispatch({ type: "unary", fn: btn.value as UnaryFn, radians }); break;
      case "equal": dispatch({ type: "equals" }); break;
      case "backspace": dispatch({ type: "backspace" }); break;
      case "clear": dispatch({ type: "clear" }); break;
    }
  }, [radians]);

  // Keyboard input (disabled while editing the layout or typing in a field)
  useEffect(() => {
    if (isEditorMode) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      let handled = true;
      if (/^[0-9]$/.test(k)) press({ type: "num", value: k });
      else if (k === "." || k === ",") press({ type: "dot", value: "." });
      else if (k === "+" || k === "-") press({ type: "operator", value: k });
      else if (k === "*" || k.toLowerCase() === "x") press({ type: "operator", value: "×" });
      else if (k === "/" || k === ":") press({ type: "operator", value: "÷" });
      else if (k === "^") press({ type: "operator", value: "^" });
      else if (k === "(" || k === ")") press({ type: "parenthesis", value: k });
      else if (k === "Enter" || k === "=") press({ type: "equal", value: "=" });
      else if (k === "Backspace") press({ type: "backspace", value: "" });
      else if (k === "Escape" || k.toLowerCase() === "c") press({ type: "clear", value: "C" });
      else if (k === "%") press({ type: "unary", value: "percent" });
      else handled = false;
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditorMode, press]);

  const memoryOp = (op: "MC" | "MR" | "M+" | "M-") => {
    const value = Number(calc.entry ?? "0");
    if (op === "MC") setMemory(0);
    else if (op === "MR") dispatch({ type: "recall", value: memory });
    else if (Number.isFinite(value)) setMemory((m) => m + (op === "M+" ? value : -value));
  };

  // ---- layout editing
  const apply = (next: CalcButton[] | null, failure = "Spazio insufficiente per questa modifica.") => {
    if (next) { setButtons(next); setNotice(null); } else setNotice(failure);
  };
  const selectedButton = buttons.find((b) => b.id === selected) ?? null;
  const hidden = buttons.filter((b) => b.hidden);
  const rows = rowCount(buttons);
  const cellHeight = HEIGHTS[size];

  const onDrop = (e: DragEvent, target: { id?: string; x?: number; y?: number }) => {
    if (!isEditorMode) return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId) return;
    if (target.id) {
      if (target.id !== sourceId) apply(swapButtons(buttons, sourceId, target.id), "I due tasti non possono essere scambiati: lo spazio non basta.");
    } else if (target.x !== undefined && target.y !== undefined) {
      apply(moveButton(buttons, sourceId, target.x, target.y));
    }
  };

  const cellStyle = (b: { x?: number; y?: number; colSpan?: number; rowSpan?: number }): CSSProperties => {
    const cols = b.colSpan || 2;
    const r = b.rowSpan || 1;
    return { gridColumn: `${(b.x ?? 0) + 1} / span ${cols}`, gridRow: `${(b.y ?? 0) + 1} / span ${r}`, minHeight: cellHeight * r + GAP * (r - 1) };
  };

  return (
    <Stack className="space-y-4">
      <Panel inset className="font-mono text-right select-none h-28 flex flex-col justify-between">
        <div className={cx("text-[11px] h-4 truncate", u.muted)} aria-label="Espressione">
          {calc.tokens.join(" ")} {memory !== 0 ? `[M = ${formatResult(memory)}]` : ""}
        </div>
        <div className={cx("text-3xl font-light truncate select-all", calc.error ? "text-red-400 !text-lg" : u.text)} role="status" aria-live="polite">{display}</div>
        <div className={cx("text-xs h-4", u.subtle)}>{preview ? `= ${preview}` : ""}</div>
      </Panel>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["MC", "MR", "M+", "M-"] as const).map((op) => (
            <Button key={op} size="sm" className="px-2.5" onClick={() => memoryOp(op)}>{op}</Button>
          ))}
        </div>
        <Segmented value={radians ? "rad" : "deg"} onChange={(v) => setRadians(v === "rad")} options={[{ value: "rad", label: "RAD" }, { value: "deg", label: "DEG" }]} />
      </div>

      {isEditorMode && (
        <Panel className="space-y-3 border-amber-500/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-amber-400">Modalità editor attiva</span>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented value={size} onChange={setSize} options={[{ value: "small", label: "P" }, { value: "medium", label: "M" }, { value: "large", label: "G" }]} />
              <Button size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => { setButtons(defaultLayout()); setSelected(null); setNotice(null); }}>Ripristina</Button>
              <Button size="sm" icon={<ArrowDownAZ className="w-3.5 h-3.5" />} onClick={() => { setButtons(autoLayout([...buttons].sort((a, b) => (["equal", "clear", "backspace"].includes(a.type) ? 1 : ["equal", "clear", "backspace"].includes(b.type) ? -1 : a.label.localeCompare(b.label))))); setSelected(null); }}>A–Z</Button>
              <Button size="sm" onClick={() => { const w = (t: string) => (t === "num" ? 1 : t === "operator" ? 2 : t === "unary" ? 3 : 4); setButtons(autoLayout([...buttons].sort((a, b) => w(a.type) - w(b.type) || a.label.localeCompare(b.label)))); setSelected(null); }}>Numeri prima</Button>
            </div>
          </div>

          {hidden.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-500/20">
              <span className={cx("text-[11px]", u.muted)}>Tasti nascosti:</span>
              {hidden.map((b) => (
                <Button key={b.id} size="sm" onClick={() => apply(showButton(buttons, b.id))}>{b.label} +</Button>
              ))}
            </div>
          )}

          {selectedButton ? (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-500/20">
              <span className="text-xs">Selezionato: <strong className="text-amber-400">{selectedButton.label}</strong></span>
              <div className="flex items-center gap-1.5">
                <span className={cx("text-[11px]", u.muted)}>Larghezza</span>
                <Segmented value={selectedButton.colSpan || 2} onChange={(w) => apply(resizeButton(buttons, selectedButton.id, w, selectedButton.rowSpan || 1))} options={[1, 2, 3, 4].map((w) => ({ value: w, label: w }))} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cx("text-[11px]", u.muted)}>Altezza</span>
                <Segmented value={selectedButton.rowSpan || 1} onChange={(h) => apply(resizeButton(buttons, selectedButton.id, selectedButton.colSpan || 2, h))} options={[1, 2].map((h) => ({ value: h, label: h }))} />
              </div>
              {selectedButton.type !== "num" && (
                <Button size="sm" variant="danger" icon={<EyeOff className="w-3.5 h-3.5" />} onClick={() => { setButtons(buttons.map((b) => (b.id === selectedButton.id ? { ...b, hidden: true } : b))); setSelected(null); }}>Nascondi</Button>
              )}
              <span className={cx("text-[11px]", u.muted)}>{selectedButton.type === "num" ? "Le cifre cambiano dimensione insieme e restano nel blocco numerico." : "Trascina il tasto per scambiarlo, oppure tocca una cella vuota per spostarlo."}</span>
            </div>
          ) : (
            <p className={cx("text-[11px] pt-1", u.muted)}>Tocca un tasto per modificarne dimensione e posizione.</p>
          )}
          {notice && <Notice tone="warn">{notice}</Notice>}
        </Panel>
      )}

      <div className="grid grid-cols-10" style={{ gap: GAP, gridTemplateRows: `repeat(${rows}, auto)` }}>
        {buttons.filter((b) => !b.hidden).map((b) => {
          const isSelected = selected === b.id;
          return (
            <button
              key={b.id}
              type="button"
              draggable={isEditorMode && b.type !== "num"}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
              onDragOver={(e) => { if (isEditorMode) e.preventDefault(); }}
              onDrop={(e) => onDrop(e, { id: b.id })}
              onClick={() => (isEditorMode ? setSelected(isSelected ? null : b.id) : press(b))}
              style={{ ...cellStyle(b), ...(isSelected ? { outline: `2px solid ${u.accentHex}`, outlineOffset: 2 } : null) }}
              className={cx(keyClass(u, b.type), isEditorMode && "border-dashed cursor-move")}
              title={isEditorMode ? `Tasto ${b.label}` : undefined}
              aria-label={b.label}
            >
              {b.label || " "}
            </button>
          );
        })}

        {isEditorMode && emptyCells(buttons).map(({ x, y }) => (
          <button
            key={`empty-${x}-${y}`}
            type="button"
            onClick={() => selected && apply(moveButton(buttons, selected, x, y))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, { x, y })}
            style={cellStyle({ x, y, colSpan: 1, rowSpan: 1 })}
            className={cx("border border-dashed text-xs cursor-pointer opacity-40 hover:opacity-100 transition-opacity", u.divider, u.muted)}
            aria-label={`Sposta qui (colonna ${x + 1}, riga ${y + 1})`}
          >
            +
          </button>
        ))}
      </div>

      <p className={cx("flex items-center justify-center gap-1.5 text-[11px] text-center pt-2", u.muted)}>
        <HelpCircle className="w-3.5 h-3.5" /> Tastiera: cifre, + − * / ^ ( ), Invio (=), Backspace, Esc (C)
      </p>
    </Stack>
  );
}
