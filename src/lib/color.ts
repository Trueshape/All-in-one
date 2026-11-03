export type Rgb = [number, number, number];

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

export const rgbToHex = ([r, g, b]: Rgb) => "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, Math.round(l * 100)];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h *= 60;
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG contrast ratio between two colours (1 to 21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Linear mix in RGB: t = 0 gives a, t = 1 gives b. */
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as Rgb;
}

export interface Harmony {
  id: "complementary" | "analogous" | "accented" | "split" | "triadic" | "tetradic" | "square" | "monochromatic";
  colors: string[];
  /** Index in `colors` of the colour the harmony was built from. */
  base: number;
  /** Hue distance in degrees of each colour from the base one. */
  offsets: number[];
}

const HUE_OFFSETS: Array<[Exclude<Harmony["id"], "monochromatic">, number[]]> = [
  ["complementary", [0, 180]],
  ["analogous", [-30, 0, 30]],
  ["accented", [-30, 0, 30, 180]],
  ["split", [0, 150, 210]],
  ["triadic", [0, 120, 240]],
  ["tetradic", [0, 60, 180, 240]],
  ["square", [0, 90, 180, 270]],
];

/** Pass `hsl` when you have it: it avoids the rounding that going through hex would add while a wheel is dragged. */
export function harmonies(hex: string, hsl?: [number, number, number]): Harmony[] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const [h, s, l] = hsl ?? rgbToHsl(rgb);
  const base = rgbToHex(rgb);
  const rotate = (deg: number) => hslToHex((((h + deg) % 360) + 360) % 360, s, l);
  const list: Harmony[] = HUE_OFFSETS.map(([id, offsets]) => ({
    id,
    colors: offsets.map((deg) => (deg === 0 ? base : rotate(deg))),
    base: offsets.indexOf(0),
    offsets,
  }));
  const lightness = [l - 30, l - 15, l, l + 15, l + 30].map((v) => clamp(v, 6, 96));
  list.push({ id: "monochromatic", colors: lightness.map((v, i) => (i === 2 ? base : hslToHex(h, s, v))), base: 2, offsets: lightness.map(() => 0) });
  return list;
}
