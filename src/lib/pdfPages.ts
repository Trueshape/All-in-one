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

/** Millimeters to PDF points (1 pt = 1/72 inch). */
export const mmToPt = (mm: number) => (mm * 72) / 25.4;
export const ptToMm = (pt: number) => (pt * 25.4) / 72;
