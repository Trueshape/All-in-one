export type PatternType = "dots" | "grid" | "diagonal" | "waves" | "chevron" | "triangles" | "checker" | "plus";

export const PATTERN_TYPES: PatternType[] = ["dots", "grid", "diagonal", "waves", "chevron", "triangles", "checker", "plus"];

export interface PatternOptions {
  type: PatternType;
  /** Tile size in px. */
  size: number;
  /** Thickness of lines and size of shapes, 1 to 10. */
  weight: number;
  rotation: number;
  fg: string;
  bg: string;
  /** Snap the tile so the image holds a whole number of tiles. */
  fit?: boolean;
  /** Size of the generated image in px. */
  width: number;
  height: number;
}

const HEX = /^#[0-9a-f]{6}$/i;
export const MIN_TILE = 4;

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

/**
 * Tile size closest to `size` that fits the image a whole number of times on both sides, so no tile is cut at the
 * edges and the spacing is identical everywhere. A square image always has such a size; a rectangle needs a common
 * divisor of both sides, and when that is too small the tile only fits across the width.
 */
export function fitTile(size: number, width: number, height: number): number {
  const wanted = Math.max(MIN_TILE, size);
  const g = gcd(Math.round(width), Math.round(height));
  let best = 0;
  for (let d = MIN_TILE; d <= g; d++) {
    if (g % d === 0 && (!best || Math.abs(d - wanted) < Math.abs(best - wanted))) best = d;
  }
  if (best) return best;
  return width / Math.max(1, Math.round(width / wanted));
}

const n = (v: number) => String(Math.round(v * 100) / 100);

function tile(type: PatternType, s: number, weight: number, fg: string): string {
  const stroke = Math.max(0.5, (s * weight) / 40);
  const line = `fill="none" stroke="${fg}" stroke-width="${n(stroke)}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (type) {
    case "dots":
      return `<circle cx="${n(s / 2)}" cy="${n(s / 2)}" r="${n((s * (0.04 + weight * 0.035)))}" fill="${fg}"/>`;
    case "grid":
      return `<path d="M0 ${n(s / 2)}H${n(s)}M${n(s / 2)} 0V${n(s)}" ${line}/>`;
    case "diagonal":
      return `<path d="M${n(-s / 2)} ${n(s / 2)}L${n(s / 2)} ${n(-s / 2)}M0 ${n(s)}L${n(s)} 0M${n(s / 2)} ${n(s * 1.5)}L${n(s * 1.5)} ${n(s / 2)}" ${line}/>`;
    case "waves":
      return `<path d="M0 ${n(s / 2)}Q${n(s / 4)} 0 ${n(s / 2)} ${n(s / 2)}T${n(s)} ${n(s / 2)}" ${line}/>`;
    case "chevron":
      return `<path d="M0 ${n(s * 0.75)}L${n(s / 2)} ${n(s * 0.25)}L${n(s)} ${n(s * 0.75)}" ${line}/>`;
    case "triangles": {
      const pad = s * (0.5 - weight * 0.04);
      return `<path d="M${n(s / 2)} ${n(s / 2 - pad)}L${n(s / 2 + pad)} ${n(s / 2 + pad)}L${n(s / 2 - pad)} ${n(s / 2 + pad)}Z" fill="${fg}"/>`;
    }
    case "checker":
      return `<path d="M0 0H${n(s / 2)}V${n(s / 2)}H0ZM${n(s / 2)} ${n(s / 2)}H${n(s)}V${n(s)}H${n(s / 2)}Z" fill="${fg}"/>`;
    case "plus":
      return `<path d="M${n(s / 2)} ${n(s * 0.25)}V${n(s * 0.75)}M${n(s * 0.25)} ${n(s / 2)}H${n(s * 0.75)}" ${line}/>`;
  }
}

/** A complete SVG image filled with a repeating pattern. Colours must be #rrggbb. */
export function patternSvg(o: PatternOptions): string {
  const fg = HEX.test(o.fg) ? o.fg : "#000000";
  const bg = HEX.test(o.bg) ? o.bg : "#ffffff";
  const s = o.fit ? fitTile(o.size, o.width, o.height) : Math.max(MIN_TILE, o.size);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}">`,
    `<defs><pattern id="p" width="${n(s)}" height="${n(s)}" patternUnits="userSpaceOnUse" patternTransform="rotate(${n(o.rotation)})">`,
    `<rect width="${n(s)}" height="${n(s)}" fill="${bg}"/>`,
    tile(o.type, s, o.weight, fg),
    `</pattern></defs>`,
    `<rect width="100%" height="100%" fill="url(#p)"/>`,
    `</svg>`,
  ].join("");
}
