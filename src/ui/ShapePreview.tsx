import type { ReactNode } from "react";
import type { ShapeId } from "../lib/geometry";
import { useUi } from "./tokens";

const C = 96;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Path of a triangle from its three sides, scaled to fit the preview; null when the sides cannot make one. */
function trianglePath(a: number, b: number, c: number): string | null {
  const x = (b * b + c * c - a * a) / (2 * c);
  const y2 = b * b - x * x;
  if (!(y2 > 0)) return null;
  const y = Math.sqrt(y2);
  const minX = Math.min(0, x);
  const w = Math.max(c, x) - minX;
  const k = Math.min(120 / w, 110 / y);
  const ox = C - (minX + w / 2) * k;
  const oy = C + (y * k) / 2;
  const p = (px: number, py: number) => `${ox + px * k},${oy - py * k}`;
  return `M${p(0, 0)}L${p(c, 0)}L${p(x, y)}Z`;
}

/** Drawing of the chosen shape, redrawn (and animated by CSS transitions) as the measures change. */
export function ShapePreview({ shape, values }: { shape: ShapeId; values: Record<string, number> }) {
  const u = useUi();
  const num = (key: string, fallback: number) => (Number.isFinite(values[key]) && values[key] > 0 ? values[key] : fallback);
  const body = { stroke: u.accentHex, fill: u.accentHex, fillOpacity: 0.08, strokeWidth: 2, strokeLinejoin: "round" as const };
  const hint = { stroke: u.accentHex, strokeOpacity: 0.45, strokeWidth: 1.2, fill: "none", strokeDasharray: "4 3" };
  const move = "transition-all duration-300";

  let drawing: ReactNode = null;

  if (shape === "square" || shape === "rectangle") {
    const a = num("a", 5);
    const b = shape === "square" ? a : num("b", 3);
    const k = shape === "square" ? clamp(a * 10, 24, 120) / a : 120 / Math.max(a, b);
    const w = a * k;
    const h = b * k;
    drawing = <rect x={C - w / 2} y={C - h / 2} width={w} height={h} rx="2" className={move} {...body} />;
  } else if (shape === "triangle") {
    const path = trianglePath(num("a", 3), num("b", 4), num("c", 5));
    drawing = path
      ? <path d={path} className={move} {...body} />
      : <path d={trianglePath(3, 4, 5) ?? ""} {...body} fillOpacity={0.02} strokeOpacity={0.35} strokeDasharray="4 3" />;
  } else if (shape === "cube" || shape === "box") {
    const a = num("a", 3);
    const b = shape === "cube" ? a : num("b", 3);
    const c = shape === "cube" ? a : num("c", 2);
    const k = Math.min(120 / (a + b * 0.5), 120 / (c + b * 0.5));
    const fw = a * k;
    const fh = c * k;
    const d = b * k * 0.5;
    const left = C - (fw + d) / 2;
    const top = C - (fh + d) / 2;
    const fx = left;
    const fy = top + d;
    drawing = (
      <g className={move}>
        <polygon points={`${fx},${fy} ${fx + d},${top} ${fx + fw + d},${top} ${fx + fw},${fy}`} fill={u.accentHex} fillOpacity={0.14} stroke={u.accentHex} strokeWidth={2} strokeLinejoin="round" />
        <polygon points={`${fx + fw},${fy} ${fx + fw + d},${top} ${fx + fw + d},${top + fh} ${fx + fw},${fy + fh}`} fill={u.accentHex} fillOpacity={0.04} stroke={u.accentHex} strokeWidth={2} strokeLinejoin="round" />
        <rect x={fx} y={fy} width={fw} height={fh} {...body} />
      </g>
    );
  } else if (shape === "cylinder") {
    const r = num("r", 2);
    const h = num("h", 5);
    const k = Math.min(120 / (2 * r), 120 / (h + 0.6 * r));
    const rx = r * k;
    const ry = rx * 0.3;
    const height = h * k;
    const top = C - height / 2;
    const bottom = C + height / 2;
    drawing = (
      <g className={move}>
        <path d={`M${C - rx},${top} L${C - rx},${bottom} A${rx},${ry} 0 0 0 ${C + rx},${bottom} L${C + rx},${top} Z`} {...body} />
        <path d={`M${C - rx},${bottom} A${rx},${ry} 0 0 1 ${C + rx},${bottom}`} {...hint} />
        <ellipse cx={C} cy={top} rx={rx} ry={ry} fill={u.accentHex} fillOpacity={0.14} stroke={u.accentHex} strokeWidth={2} />
      </g>
    );
  } else {
    const radius = clamp(num("r", 4) * 10, 20, 84);
    drawing = (
      <g>
        <circle cx={C} cy={C} r={radius} className={move} {...body} />
        <ellipse cx={C} cy={C} rx={radius} ry={radius * 0.3} className={move} {...hint} />
        <line x1={C} y1={C} x2={C + radius} y2={C} stroke={u.accentHex} strokeWidth={2} className={move} />
        <circle cx={C} cy={C} r="3.5" fill={u.accentHex} />
      </g>
    );
  }

  return (
    <svg key={shape} viewBox="0 0 192 192" className="w-48 h-48 shape-pop" role="img" aria-label={`Anteprima: ${shape}`}>
      <circle cx={C} cy={C} r="88" fill="none" stroke={u.mutedHex} strokeWidth="1" strokeDasharray="3 3" className="dash-flow" />
      {drawing}
    </svg>
  );
}
