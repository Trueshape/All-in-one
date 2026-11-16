/** Geometry and image processing for the handwriting-to-font tool: a printable sheet, and glyph outlines read back from a photo of it. */

export const CHARS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?'\"-()@&€%/+=");
export const COLS = 10;
export const ROWS = Math.ceil(CHARS.length / COLS);

/** Sheet layout in pixels: a black frame around a grid of square cells. */
export const CELL = 200;
export const MARGIN = 40;
export const FRAME = 8;
/** Inside a cell: the label sits above `LABEL`, the baseline guide at `BASELINE` (both as a fraction of the cell height). */
export const LABEL = 0.24;
export const BASELINE = 0.78;

export const sheetSize = () => ({ width: COLS * CELL + MARGIN * 2, height: ROWS * CELL + MARGIN * 2 });

/** Otsu's method: the gray level that best separates ink from paper. */
export function otsu(gray: Uint8Array): number {
  const hist = new Array<number>(256).fill(0);
  for (const v of gray) hist[v]++;
  let total = 0;
  for (let i = 0; i < 256; i++) total += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestVar = -1;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = gray.length - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (total - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > bestVar) {
      bestVar = between;
      best = t;
    }
  }
  return best;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bounding box of every pixel at or below `threshold`; null when the image has no ink. */
export function inkBox(gray: Uint8Array, width: number, height: number, threshold: number): Box | null {
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (gray[y * width + x] > threshold) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Writing area of cell `index` inside a sheet of the given size (the frame box, scaled to the template). Skips the label strip and the grid lines. */
export function cellArea(index: number, sheet: Box): Box {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const cw = sheet.w / COLS;
  const ch = sheet.h / ROWS;
  const padX = cw * 0.06;
  const padBottom = ch * 0.04;
  return { x: sheet.x + col * cw + padX, y: sheet.y + row * ch + ch * LABEL, w: cw - padX * 2, h: ch * (1 - LABEL) - padBottom };
}

/** Where the baseline falls inside the writing area, as a fraction of its height. */
export const baselineInArea = (BASELINE - LABEL) / (1 - LABEL - 0.04);

export interface Run {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Turns a binary mask into rectangles: horizontal runs, with identical runs on consecutive rows merged. */
export function maskToRects(mask: Uint8Array, width: number, height: number): Run[] {
  const rects: Run[] = [];
  let open = new Map<string, Run>();
  for (let y = 0; y < height; y++) {
    const next = new Map<string, Run>();
    let x = 0;
    while (x < width) {
      if (!mask[y * width + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < width && mask[y * width + x]) x++;
      const key = `${start}:${x}`;
      const above = open.get(key);
      if (above) {
        above.h++;
        next.set(key, above);
      } else {
        const run = { x: start, y, w: x - start, h: 1 };
        rects.push(run);
        next.set(key, run);
      }
    }
    open = next;
  }
  return rects;
}

export interface Glyph {
  char: string;
  /** Contour rectangles in font units, y pointing up, baseline at 0. */
  rects: Run[];
  advance: number;
}

export const UNITS = 1000;
/** Font metrics: the writing area spans `ASCENT + DESCENT` units. */
export const ASCENT = 760;
export const DESCENT = 240;
const BEARING = 50;
const MIN_INK = 0.004;

/** Builds a glyph from the binary mask of one cell (`mask[i]` = 1 for ink); null when the cell is empty or only has specks. */
export function glyphFromMask(char: string, mask: Uint8Array, width: number, height: number): Glyph | null {
  let ink = 0;
  for (const v of mask) ink += v;
  if (ink < width * height * MIN_INK) return null;

  const rects = maskToRects(mask, width, height);
  const scale = (ASCENT + DESCENT) / height;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    maxX = Math.max(maxX, r.x + r.w);
  }
  const base = baselineInArea * height;
  return {
    char,
    rects: rects.map((r) => ({
      x: (r.x - minX) * scale + BEARING,
      y: (base - (r.y + r.h)) * scale,
      w: r.w * scale,
      h: r.h * scale,
    })),
    advance: Math.round((maxX - minX) * scale + BEARING * 2),
  };
}

/** Characters offered when drawing online (the printed sheet only has the first four groups, minus the accents). */
export const GROUPS: Array<{ id: string; label: string; chars: string[] }> = [
  { id: "upper", label: "Maiuscole", chars: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ") },
  { id: "lower", label: "Minuscole", chars: Array.from("abcdefghijklmnopqrstuvwxyz") },
  { id: "digits", label: "Numeri", chars: Array.from("0123456789") },
  { id: "punct", label: "Punteggiatura", chars: Array.from(".,;:!?'\"-()@&€%/+=") },
  { id: "accents", label: "Accentate", chars: Array.from("àáâäèéêëìíîïòóôöùúûüçñÀÈÉÌÒÙÇÑ") },
];

/** Drawing pad: size in px, and where the guides sit (fractions of the height). The baseline matches `baselineInArea`. */
export const PAD = { w: 360, h: 480, baseline: baselineInArea, capLine: 0.2, xLine: 0.47 };

/** Glyph ids: `base` is the normal glyph of a character, `alt` the variant that replaces it. */
export interface Substitution {
  base: number;
  alt: number;
}

const sorted = (ids: number[]) => [...ids].sort((a, b) => a - b);
const coverage = (ids: number[]) => ({ format: 1, glyphs: sorted(ids) });
const byBase = (list: Substitution[]) => [...list].sort((a, b) => a.base - b.base);
const single = (list: Substitution[]) => ({
  lookupType: 1,
  lookupFlag: 0,
  subtables: [{ substFormat: 2, coverage: coverage(list.map((s) => s.base)), substitute: byBase(list).map((s) => s.alt) }],
});

/**
 * GSUB table (opentype.js shape) with a `calt` feature that makes the variants take turns: after a normal glyph the next letter takes
 * its first variant, after a first variant the next takes its second, and so on; after the last variant it goes back to the normal one.
 * A font file cannot pick at random, so this rotation is what makes two equal letters side by side look different.
 * `bases` are all the normal glyphs; `slots[i]` the substitutions for turn i + 1. Null when there is no variant at all.
 */
export function cyclingGsub(bases: number[], slots: Substitution[][]) {
  const used = slots.filter((s) => s.length);
  if (!used.length) return null;
  const chain = { lookupType: 6, lookupFlag: 0, subtables: [] as object[] };
  const lookups: Array<{ lookupType: number; lookupFlag: number; subtables: object[] }> = [chain];
  used.forEach((swaps, i) => {
    chain.subtables.push({
      substFormat: 3,
      // the glyph before: a normal glyph for the first turn, otherwise a variant from the previous turn
      backtrackCoverage: [coverage(i === 0 ? bases : used[i - 1].map((s) => s.alt))],
      inputCoverage: [coverage(swaps.map((s) => s.base))],
      lookaheadCoverage: [],
      lookupRecords: [{ sequenceIndex: 0, lookupListIndex: i + 1 }],
    });
    lookups.push(single(swaps));
  });
  const langSys = { reserved: 0, reqFeatureIndex: 0xffff, featureIndexes: [0] };
  return {
    version: 1,
    scripts: [
      { tag: "DFLT", script: { defaultLangSys: langSys, langSysRecords: [] } },
      { tag: "latn", script: { defaultLangSys: langSys, langSysRecords: [] } },
    ],
    features: [{ tag: "calt", feature: { featureParams: 0, lookupListIndexes: [0] } }],
    lookups,
  };
}

export interface Point {
  x: number;
  y: number;
}
export type Stroke = Point[];
