import { useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { hexToRgb, rgbToHsl } from "../lib/color";
import type { Harmony } from "../lib/color";

export const HARMONY_NAMES: Record<Harmony["id"], { name: string; hint: string }> = {
  complementary: { name: "Complementari", hint: "Opposti sulla ruota: massimo contrasto." },
  analogous: { name: "Analoghi", hint: "Vicini sulla ruota: armonia morbida." },
  accented: { name: "Analoghi con accento", hint: "Tre colori vicini più il complementare come accento." },
  split: { name: "Split-complementari", hint: "Il colore e i due vicini del suo opposto." },
  triadic: { name: "Triade", hint: "Tre colori a 120° l'uno dall'altro." },
  tetradic: { name: "Tetradica", hint: "Due coppie di complementari (rettangolo)." },
  square: { name: "Quadrato", hint: "Quattro colori a 90° l'uno dall'altro." },
  monochromatic: { name: "Monocromatica", hint: "Stesso colore, luminosità diversa." },
};

const HUES = [0, 60, 120, 180, 240, 300, 360];

/** Hue goes around the wheel (0° at the top, clockwise), saturation grows from the centre to the edge. */
const wheelBackground = (lightness: number) =>
  `radial-gradient(circle closest-side, hsl(0 0% ${lightness}%), hsl(0 0% ${lightness}% / 0)), conic-gradient(from 0deg, ${HUES.map((h) => `hsl(${h} 100% ${lightness}%)`).join(", ")})`;

/**
 * A colour wheel with one marker per colour. With `onPick` it is a control: drag, or use the arrow keys
 * (left/right = hue, up/down = saturation, Shift = bigger steps). Without it, it only shows its colours.
 * Dragging moves the colour whose marker is nearest to where the pointer went down; `baseIndex` marks the base colour with a larger marker.
 */
export function ColorWheel({
  size,
  lightness,
  colors,
  onPick,
  baseIndex = 0,
  label,
}: {
  size: number;
  lightness: number;
  colors: string[];
  onPick?: (hue: number, saturation: number, index: number) => void;
  baseIndex?: number;
  label: string;
}) {
  const half = size / 2;
  const marks = colors.map((hex) => {
    const [h, s] = rgbToHsl(hexToRgb(hex) ?? [0, 0, 0]);
    const angle = (h * Math.PI) / 180;
    return { hex, x: half + Math.sin(angle) * half * (s / 100) * 0.94, y: half - Math.cos(angle) * half * (s / 100) * 0.94, h, s };
  });
  const base = marks[baseIndex];
  const grabbed = useRef(baseIndex);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    if (!onPick) return;
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    const hue = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    onPick(hue, Math.min(100, (Math.hypot(dx, dy) / (box.width / 2)) * 100), grabbed.current);
  };

  /** The marker closest to the pointer wins; on a tie (markers on top of each other) the base one. */
  const grab = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    let best = baseIndex;
    let bestDistance = Math.hypot(marks[baseIndex].x - px, marks[baseIndex].y - py);
    marks.forEach((m, i) => {
      const d = Math.hypot(m.x - px, m.y - py);
      if (d < bestDistance - 0.5) {
        best = i;
        bestDistance = d;
      }
    });
    grabbed.current = best;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onPick || !base) return;
    const step = e.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onPick((base.h + move[0] + 360) % 360, Math.min(100, Math.max(0, base.s + move[1])), baseIndex);
  };

  return (
    <div
      role={onPick ? "slider" : "img"}
      aria-label={label}
      aria-valuetext={base ? `${base.hex.toUpperCase()}` : undefined}
      tabIndex={onPick ? 0 : undefined}
      onPointerDown={(e) => {
        if (!onPick) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        grab(e);
        pick(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e);
      }}
      onKeyDown={onKeyDown}
      className="relative rounded-full shrink-0 select-none"
      style={{ width: size, height: size, backgroundImage: wheelBackground(lightness), touchAction: "none", cursor: onPick ? "crosshair" : "default", boxShadow: "0 0 0 1px rgba(127,127,127,.35)" }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="absolute inset-0 pointer-events-none">
        {marks.length > 1 && <polygon points={marks.map((m) => `${m.x},${m.y}`).join(" ")} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinejoin="round" />}
        {marks.map((m, i) => (
          <circle key={i} cx={m.x} cy={m.y} r={i === baseIndex ? size * 0.055 : size * 0.042} fill={m.hex} stroke="#fff" strokeWidth={i === baseIndex ? 2.5 : 1.5} />
        ))}
      </svg>
    </div>
  );
}
