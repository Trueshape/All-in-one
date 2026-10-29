/** Keypad layout model for the scientific calculator (10-column grid, customizable in editor mode). */

export type ButtonType = "num" | "operator" | "unary" | "clear" | "backspace" | "dot" | "equal" | "parenthesis" | "empty";

export interface CalcButton {
  id: string;
  label: string;
  type: ButtonType;
  value: string;
  colSpan?: number;
  rowSpan?: number;
  className?: string; // kept for compatibility with layouts saved by earlier versions
  x?: number;
  y?: number;
  hidden?: boolean;
}

export const COLS = 10;
export const MIN_ROWS = 7;

export const DEFAULT_COORDS: Record<string, { x: number; y: number }> = {
  paren_open: { x: 0, y: 0 }, paren_close: { x: 2, y: 0 }, square: { x: 4, y: 0 }, pow: { x: 6, y: 0 }, clear: { x: 8, y: 0 },
  sin: { x: 0, y: 1 }, cos: { x: 2, y: 1 }, tan: { x: 4, y: 1 }, sqrt: { x: 6, y: 1 }, backspace: { x: 8, y: 1 },
  ln: { x: 0, y: 2 }, log: { x: 2, y: 2 }, pi: { x: 4, y: 2 }, e: { x: 6, y: 2 }, div: { x: 8, y: 2 },
  recip: { x: 0, y: 3 }, num_7: { x: 2, y: 3 }, num_8: { x: 4, y: 3 }, num_9: { x: 6, y: 3 }, mul: { x: 8, y: 3 },
  neg: { x: 0, y: 4 }, num_4: { x: 2, y: 4 }, num_5: { x: 4, y: 4 }, num_6: { x: 6, y: 4 }, sub: { x: 8, y: 4 },
  percent: { x: 0, y: 5 }, num_1: { x: 2, y: 5 }, num_2: { x: 4, y: 5 }, num_3: { x: 6, y: 5 }, add: { x: 8, y: 5 },
  num_0: { x: 2, y: 6 }, dot: { x: 4, y: 6 }, equal: { x: 6, y: 6 },
};

const def = (id: string, label: string, type: ButtonType, value: string, colSpan = 2): CalcButton => ({ id, label, type, value, colSpan, rowSpan: 1, ...DEFAULT_COORDS[id] });

export const defaultLayout = (): CalcButton[] => [
  def("paren_open", "(", "parenthesis", "("), def("paren_close", ")", "parenthesis", ")"), def("square", "x²", "unary", "square"), def("pow", "xʸ", "operator", "^"), def("clear", "C", "clear", "C"),
  def("sin", "sin", "unary", "sin"), def("cos", "cos", "unary", "cos"), def("tan", "tan", "unary", "tan"), def("sqrt", "√", "unary", "sqrt"), def("backspace", "⌫", "backspace", "⌫"),
  def("ln", "ln", "unary", "ln"), def("log", "log", "unary", "log"), def("pi", "π", "unary", "pi"), def("e", "e", "unary", "e"), def("div", "÷", "operator", "÷"),
  def("recip", "1/x", "unary", "recip"), def("num_7", "7", "num", "7"), def("num_8", "8", "num", "8"), def("num_9", "9", "num", "9"), def("mul", "×", "operator", "×"),
  def("neg", "±", "unary", "neg"), def("num_4", "4", "num", "4"), def("num_5", "5", "num", "5"), def("num_6", "6", "num", "6"), def("sub", "-", "operator", "-"),
  def("percent", "%", "unary", "percent"), def("num_1", "1", "num", "1"), def("num_2", "2", "num", "2"), def("num_3", "3", "num", "3"), def("add", "+", "operator", "+"),
  def("num_0", "0", "num", "0"), def("dot", ".", "dot", "."), def("equal", "=", "equal", "=", 4),
];

const span = (b: CalcButton) => ({ cols: b.colSpan || 2, rows: b.rowSpan || 1 });

export const rowCount = (buttons: CalcButton[]) =>
  Math.max(MIN_ROWS, ...buttons.filter((b) => !b.hidden).map((b) => (b.y ?? 0) + (b.rowSpan ?? 1)));

/** Cells covered by the visible buttons, optionally ignoring some ids. */
function occupancy(buttons: CalcButton[], ignore: string[] = []): Set<string> {
  const cells = new Set<string>();
  for (const b of buttons) {
    if (b.hidden || ignore.includes(b.id)) continue;
    const { cols, rows } = span(b);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.add(`${(b.x ?? 0) + c},${(b.y ?? 0) + r}`);
  }
  return cells;
}

/** Grid cells not covered by any visible button (used to show drop targets in editor mode). */
export function emptyCells(buttons: CalcButton[]): Array<{ x: number; y: number }> {
  const taken = occupancy(buttons);
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < rowCount(buttons); y++) for (let x = 0; x < COLS; x++) if (!taken.has(`${x},${y}`)) cells.push({ x, y });
  return cells;
}

export function fits(buttons: CalcButton[], id: string, x: number, y: number, cols: number, rows: number, ignore: string[] = []): boolean {
  if (x < 0 || y < 0 || x + cols > COLS) return false;
  const taken = occupancy(buttons, [id, ...ignore]);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (taken.has(`${x + c},${y + r}`)) return false;
  return true;
}

function freeSlot(buttons: CalcButton[], id: string, cols: number, rows: number): { x: number; y: number } {
  for (let y = 0; y < 60; y++) for (let x = 0; x + cols <= COLS; x++) if (fits(buttons, id, x, y, cols, rows)) return { x, y };
  return { x: 0, y: 0 };
}

/** Repairs a saved layout: validates entries, assigns missing coordinates, adds buttons that are missing. */
export function normalize(saved: unknown): CalcButton[] {
  const defaults = defaultLayout();
  if (!Array.isArray(saved)) return defaults;
  const valid = saved.filter((b): b is CalcButton => !!b && typeof b.id === "string" && typeof b.label === "string" && typeof b.type === "string" && b.type !== "empty");
  if (!valid.length) return defaults;

  const placed: CalcButton[] = valid.filter((b) => typeof b.x === "number" && typeof b.y === "number");
  const result = [...placed];
  for (const b of valid.filter((v) => !placed.includes(v))) {
    const { cols, rows } = span(b);
    const preferred = DEFAULT_COORDS[b.id];
    const spot = preferred && fits(result, b.id, preferred.x, preferred.y, cols, rows) ? preferred : freeSlot(result, b.id, cols, rows);
    result.push({ ...b, ...spot });
  }
  for (const d of defaults) {
    if (!result.some((b) => b.id === d.id)) {
      const { cols, rows } = span(d);
      result.push({ ...d, ...freeSlot(result, d.id, cols, rows), hidden: true });
    }
  }
  return result;
}

const numberCoords = (id: string, cols: number, rows: number) => {
  const digit = Number(id.replace("num_", ""));
  const col = digit === 0 ? 0 : (digit - 1) % 3;
  const row = digit === 0 ? 3 : 2 - Math.floor((digit - 1) / 3);
  return { x: 2 + col * cols, y: 3 + row * rows };
};

/** Places the digits in a phone-style block, then every other button in the first free slot, in the given order. */
export function autoLayout(order: CalcButton[]): CalcButton[] {
  const nums = order.filter((b) => b.type === "num");
  const cols = nums[0]?.colSpan || 2;
  const rows = nums[0]?.rowSpan || 1;
  const placed: CalcButton[] = nums.map((b) => ({ ...b, ...numberCoords(b.id, cols, rows) }));
  const result = [...placed];
  for (const b of order.filter((o) => o.type !== "num")) {
    if (b.hidden) {
      result.push(b);
      continue;
    }
    const s = span(b);
    result.push({ ...b, ...freeSlot(result, b.id, s.cols, s.rows) });
  }
  // keep the original array order for stable rendering keys
  return order.map((b) => result.find((r) => r.id === b.id)!);
}

/** Re-places only the digit block; other buttons keep their position unless they would now overlap. */
function relayoutNumbers(buttons: CalcButton[]): CalcButton[] {
  const nums = buttons.filter((b) => b.type === "num");
  const cols = nums[0]?.colSpan || 2;
  const rows = nums[0]?.rowSpan || 1;
  const result: CalcButton[] = nums.map((b) => ({ ...b, ...numberCoords(b.id, cols, rows) }));
  for (const b of buttons.filter((o) => o.type !== "num")) {
    const s = span(b);
    const keep = b.hidden || fits(result, b.id, b.x ?? 0, b.y ?? 0, s.cols, s.rows);
    result.push(keep ? b : { ...b, ...freeSlot(result, b.id, s.cols, s.rows) });
  }
  return buttons.map((b) => result.find((r) => r.id === b.id)!);
}

/** Shows a hidden button again, at its old spot if free or in the first free slot. */
export function showButton(buttons: CalcButton[], id: string): CalcButton[] {
  const b = buttons.find((v) => v.id === id);
  if (!b) return buttons;
  const s = span(b);
  const spot = fits(buttons, id, b.x ?? 0, b.y ?? 0, s.cols, s.rows) ? { x: b.x ?? 0, y: b.y ?? 0 } : freeSlot(buttons, id, s.cols, s.rows);
  return buttons.map((v) => (v.id === id ? { ...v, ...spot, hidden: false } : v));
}

/** Resizes a button in place (shifting left when needed). Returns null when there is no room. */
export function resizeButton(buttons: CalcButton[], id: string, cols: number, rows: number): CalcButton[] | null {
  const target = buttons.find((b) => b.id === id);
  if (!target) return null;

  if (target.type === "num") {
    const c = Math.min(cols, 2);
    const r = Math.min(rows, 2);
    return relayoutNumbers(buttons.map((b) => (b.type === "num" ? { ...b, colSpan: c, rowSpan: r } : b)));
  }

  const x0 = target.x ?? 0;
  const y0 = target.y ?? 0;
  const current = span(target).cols;
  for (let dx = 0; dx >= -Math.max(0, cols - current); dx--) {
    if (fits(buttons, id, x0 + dx, y0, cols, rows)) {
      return buttons.map((b) => (b.id === id ? { ...b, x: x0 + dx, colSpan: cols, rowSpan: rows } : b));
    }
  }
  return null;
}

/** Swaps the positions of two buttons if both still fit; returns null otherwise. */
export function swapButtons(buttons: CalcButton[], aId: string, bId: string): CalcButton[] | null {
  const a = buttons.find((b) => b.id === aId);
  const b = buttons.find((x) => x.id === bId);
  if (!a || !b || a.type === "num" || b.type === "num") return null;
  const sa = span(a);
  const sb = span(b);
  if (!fits(buttons, aId, b.x ?? 0, b.y ?? 0, sa.cols, sa.rows, [bId]) || !fits(buttons, bId, a.x ?? 0, a.y ?? 0, sb.cols, sb.rows, [aId])) return null;
  return buttons.map((x) => (x.id === aId ? { ...x, x: b.x, y: b.y } : x.id === bId ? { ...x, x: a.x, y: a.y } : x));
}

export function moveButton(buttons: CalcButton[], id: string, x: number, y: number): CalcButton[] | null {
  const b = buttons.find((v) => v.id === id);
  if (!b || b.type === "num") return null;
  const { cols, rows } = span(b);
  return fits(buttons, id, x, y, cols, rows) ? buttons.map((v) => (v.id === id ? { ...v, x, y } : v)) : null;
}
