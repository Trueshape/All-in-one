/** Pure helpers for the PDF tools: page lists typed by the user, reordering, crop margins and text lines. Pages are 0-based here, 1-based for the user. */

/** "1-3, 5" → groups of 0-based page indices, one group per comma-separated part. An error message when a part is not valid. */
export function parseRangeGroups(text: string, count: number): number[][] | string {
  const parts = text.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return "Scrivi le pagine, per esempio 1-3, 5.";
  const groups: number[][] = [];
  for (const part of parts) {
    const m = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part);
    if (!m) return `"${part}" non è un numero di pagina o un intervallo come 2-5.`;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from < 1 || to < 1 || from > count || to > count) return `"${part}": il PDF ha ${count} pagine.`;
    if (from > to) return `"${part}": il primo numero deve essere il più piccolo.`;
    groups.push(Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i));
  }
  return groups;
}

/** "1-3, 5" → sorted, unique 0-based page indices; an error message when the text is not valid. */
export function parsePageList(text: string, count: number): number[] | string {
  const groups = parseRangeGroups(text, count);
  return typeof groups === "string" ? groups : [...new Set(groups.flat())].sort((a, b) => a - b);
}

/** Pages 0..count-1 cut into groups of `size` (the last one can be shorter). */
export function chunkPages(count: number, size: number): number[][] {
  const groups: number[][] = [];
  for (let start = 0; start < count; start += size) groups.push(Array.from({ length: Math.min(size, count - start) }, (_, i) => start + i));
  return groups;
}

/** "Pagine 1–3" or "Pagina 5" for a group of 0-based indices in order. */
export const groupLabel = (group: number[]) =>
  group.length === 1 ? `Pagina ${group[0] + 1}` : `Pagine ${group[0] + 1}–${group[group.length - 1] + 1}`;

/** The list with the item at `from` moved to position `to`. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Margins seen on screen → margins on the page's own edges. A page with /Rotate 90 is shown turned clockwise,
 * so what looks like its top is its left edge, and so on.
 */
export function marginsForRotation(seen: Margins, rotation: number): Margins {
  const { top, right, bottom, left } = seen;
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return { left: top, top: right, right: bottom, bottom: left };
    case 180:
      return { bottom: top, left: right, top: bottom, right: left };
    case 270:
      return { right: top, bottom: right, left: bottom, top: left };
    default:
      return seen;
  }
}

export interface TextPiece {
  str: string;
  x: number;
  y: number;
  height: number;
  hasEOL?: boolean;
}

/** Text pieces of one page (PDF coordinates, y up) → lines read top to bottom, left to right. Pieces whose baselines are closer than half a line are one line. */
export function piecesToLines(pieces: TextPiece[]): string[] {
  const sorted = pieces.filter((p) => p.str.trim() || p.str === " ").sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextPiece[][] = [];
  for (const piece of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - piece.y) < Math.max(2, (line[0].height || piece.height) / 2)) line.push(piece);
    else lines.push([piece]);
  }
  return lines.map((line) =>
    line
      .sort((a, b) => a.x - b.x)
      .map((p) => p.str)
      .join("")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export interface PageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where to draw a mark `w` × `h` turned by `angle` degrees (counterclockwise): its bottom-left corner, so that the mark's
 * centre lands at the centre of the page, or on a staggered grid that covers the whole page ("tile").
 */
export function markAnchors(box: PageBox, w: number, h: number, angle: number, layout: "center" | "tile"): Array<{ x: number; y: number }> {
  const a = (angle * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const anchor = (cx: number, cy: number) => ({ x: cx - (cos * w - sin * h) / 2, y: cy - (sin * w + cos * h) / 2 });
  if (layout === "center") return [anchor(box.x + box.width / 2, box.y + box.height / 2)];
  const gap = Math.max(36, h * 1.5);
  const stepX = Math.abs(w * cos) + Math.abs(h * sin) + gap;
  const stepY = Math.abs(w * sin) + Math.abs(h * cos) + gap;
  const out: Array<{ x: number; y: number }> = [];
  for (let row = 0, cy = box.y + stepY / 2; cy < box.y + box.height + stepY / 2 && out.length < 400; row++, cy += stepY) {
    for (let cx = box.x + (row % 2 ? stepX : stepX / 2); cx < box.x + box.width + stepX / 2 && out.length < 400; cx += stepX) out.push(anchor(cx, cy));
  }
  return out;
}

/** A piece of text as pdf.js reports it, in the page as shown (x to the right, y downward, y at the baseline), in points. */
export interface RawText {
  str: string;
  x: number;
  y: number;
  width: number;
  size: number;
  family?: string;
}

/** A run of text that is edited as one unit: one line of one column. */
export interface TextBox {
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
  family?: string;
}

/** Gap, in font sizes, up to which two pieces on one baseline are the same box: a word space is about 0.3, justified text stretches it. Anything wider is another field. */
export const JOIN_GAP = 0.4;

/** Pieces on the same baseline are one box while the gap between them is small; a wider gap starts a new box (another column, cell or form field). Better two boxes for one line than one box for two fields. */
export function groupText(pieces: RawText[]): TextBox[] {
  // pdf.js puts a blank piece as wide as the gap between two separate texts: it would glue them together, so only real text counts
  const sorted = pieces.filter((p) => p.str.trim() !== "").sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: RawText[][] = [];
  for (const piece of sorted) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - piece.y) < Math.max(1.5, piece.size * 0.4)) row.push(piece);
    else rows.push([piece]);
  }
  const boxes: TextBox[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let box: TextBox | null = null;
    for (const p of row) {
      if (box && p.x - (box.x + box.width) < p.size * JOIN_GAP) {
        const gap = p.x - (box.x + box.width);
        const spaced = /\s$/.test(box.text) || /^\s/.test(p.str) || gap < p.size * 0.15 ? "" : " ";
        box.text += spaced + p.str;
        box.width = p.x + p.width - box.x;
        box.size = Math.max(box.size, p.size);
      } else {
        if (box) boxes.push(box);
        box = { text: p.str, x: p.x, y: p.y, width: p.width, size: p.size, family: p.family };
      }
    }
    if (box) boxes.push(box);
  }
  return boxes.filter((b) => b.text.trim());
}

export interface View {
  /** Zoom: 1 shows the whole page. */
  scale: number;
  /** Where the page's top-left corner sits in the frame, in px (zero or negative once zoomed in). */
  x: number;
  y: number;
}

export const MAX_ZOOM = 8;

/** Keeps the zoomed page covering the frame, so no empty border shows. */
export function clampView(view: View, width: number, height: number): View {
  const scale = Math.min(MAX_ZOOM, Math.max(1, view.scale));
  return { scale, x: Math.min(0, Math.max(width - width * scale, view.x)), y: Math.min(0, Math.max(height - height * scale, view.y)) };
}

/** Zooms by `factor` keeping the point under the cursor (px from the frame's top-left corner) where it is. */
export function zoomAt(view: View, factor: number, px: number, py: number, width: number, height: number): View {
  const scale = Math.min(MAX_ZOOM, Math.max(1, view.scale * factor));
  const ratio = scale / view.scale;
  return clampView({ scale, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio }, width, height);
}

/**
 * The colour of the paper around a box: the most common colour on a thin ring just outside it, as "#rrggbb".
 * A ring crossing a picture or a neighbouring letter still gives the background, because that is what most of it is.
 */
export function ringBackground(rgba: Uint8ClampedArray, width: number, height: number, box: { x: number; y: number; w: number; h: number }, margin = 2): string {
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
  const take = (px: number, py: number) => {
    const x = Math.round(px);
    const y = Math.round(py);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    if (rgba[i + 3] < 128) return;
    // colours that differ by a few levels (compression, anti-aliasing) count as one
    const key = ((rgba[i] >> 3) << 10) | ((rgba[i + 1] >> 3) << 5) | (rgba[i + 2] >> 3);
    const hit = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    hit.n++;
    hit.r += rgba[i];
    hit.g += rgba[i + 1];
    hit.b += rgba[i + 2];
    counts.set(key, hit);
  };
  const x0 = box.x - margin;
  const y0 = box.y - margin;
  const x1 = box.x + box.w + margin;
  const y1 = box.y + box.h + margin;
  for (let x = x0; x <= x1; x += 2) {
    take(x, y0);
    take(x, y1);
  }
  for (let y = y0; y <= y1; y += 2) {
    take(x0, y);
    take(x1, y);
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const hit of counts.values()) if (!best || hit.n > best.n) best = hit;
  if (!best) return "#ffffff";
  const hex = (sum: number) => Math.round(sum / best!.n).toString(16).padStart(2, "0");
  return "#" + hex(best.r) + hex(best.g) + hex(best.b);
}

/** The colour of the text inside a box: the pixel that stands out most from the background `bg` ("#rrggbb"), as "#rrggbb". */
export function inkColour(rgba: Uint8ClampedArray, width: number, height: number, box: { x: number; y: number; w: number; h: number }, bg: string): string {
  const back = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  let best = -1;
  let ink = "#000000";
  const x1 = Math.min(width, Math.ceil(box.x + box.w));
  const y1 = Math.min(height, Math.ceil(box.y + box.h));
  for (let y = Math.max(0, Math.floor(box.y)); y < y1; y++) {
    for (let x = Math.max(0, Math.floor(box.x)); x < x1; x++) {
      const i = (y * width + x) * 4;
      if (rgba[i + 3] < 128) continue;
      const d = (rgba[i] - back[0]) ** 2 + (rgba[i + 1] - back[1]) ** 2 + (rgba[i + 2] - back[2]) ** 2;
      if (d > best) {
        best = d;
        ink = "#" + [rgba[i], rgba[i + 1], rgba[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
      }
    }
  }
  return ink;
}

/**
 * The tightest rectangle around the ink inside `band` (pixels), or null when there is none.
 * Rows of ink that run across almost the whole band at its top or bottom are a rule or an underline, not letters: they are left out,
 * so a border drawn right under the text is never inside the rectangle.
 */
export function inkBounds(rgba: Uint8ClampedArray, width: number, height: number, band: { x: number; y: number; w: number; h: number }, bg: string, threshold = 60): { x0: number; y0: number; x1: number; y1: number } | null {
  const back = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  const left = Math.max(0, Math.floor(band.x));
  const right = Math.min(width, Math.ceil(band.x + band.w));
  const top = Math.max(0, Math.floor(band.y));
  const bottom = Math.min(height, Math.ceil(band.y + band.h));
  const span = right - left;
  if (span <= 0 || bottom <= top) return null;
  const isInk = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (rgba[i + 3] < 128) return false;
    return (rgba[i] - back[0]) ** 2 + (rgba[i + 1] - back[1]) ** 2 + (rgba[i + 2] - back[2]) ** 2 > threshold * threshold;
  };
  const edge = Math.max(1, Math.round((bottom - top) * 0.25));
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = top; y < bottom; y++) {
    let first = -1;
    let last = -1;
    let count = 0;
    for (let x = left; x < right; x++) {
      if (!isInk(x, y)) continue;
      if (first < 0) first = x;
      last = x;
      count++;
    }
    if (count === 0) continue;
    if (count >= span * 0.92 && (y - top < edge || bottom - 1 - y < edge)) continue;
    x0 = Math.min(x0, first);
    x1 = Math.max(x1, last + 1);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y + 1);
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** Millimeters to PDF points (1 pt = 1/72 inch). */
export const mmToPt = (mm: number) => (mm * 72) / 25.4;
export const ptToMm = (pt: number) => (pt * 25.4) / 72;
