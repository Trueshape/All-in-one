export interface RadarSeries {
  name: string;
  color: string;
  values: number[];
}

export interface RadarOptions {
  axes: string[];
  series: RadarSeries[];
  max: number;
  rings: number;
}

export const SERIES_COLORS = ["#6366f1", "#ef4444", "#10b981", "#f59e0b"];
export const RADAR_SIZE = 480;

const CENTER = RADAR_SIZE / 2;
const RADIUS = 150;

const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Corner of the chart for axis `i` of `n` (axis 0 points up) at `fraction` of the radius; `extra` pushes it outward, in px. */
export function radarPoint(i: number, n: number, fraction: number, extra = 0): { x: number; y: number } {
  const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
  const r = RADIUS * fraction + extra;
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);
const clamp = (v: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0);

/** The whole chart as a standalone SVG on a white background. Values are clamped to 0..max. */
export function radarSvg({ axes, series, max, rings }: RadarOptions): string {
  const n = axes.length;
  const poly = (fraction: (i: number) => number) =>
    axes.map((_, i) => { const p = radarPoint(i, n, fraction(i)); return `${fmt(p.x)},${fmt(p.y)}`; }).join(" ");
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RADAR_SIZE} ${RADAR_SIZE}" width="${RADAR_SIZE}" height="${RADAR_SIZE}" font-family="system-ui, sans-serif">`, `<rect width="${RADAR_SIZE}" height="${RADAR_SIZE}" fill="#ffffff"/>`];
  for (let ring = 1; ring <= rings; ring++) {
    parts.push(`<polygon points="${poly(() => ring / rings)}" fill="none" stroke="#d4d4d8" stroke-width="1"/>`);
    const p = radarPoint(0, n, ring / rings);
    parts.push(`<text x="${fmt(p.x + 4)}" y="${fmt(p.y + 3)}" font-size="9" fill="#a1a1aa">${fmt((max * ring) / rings)}</text>`);
  }
  axes.forEach((label, i) => {
    const end = radarPoint(i, n, 1);
    parts.push(`<line x1="${CENTER}" y1="${CENTER}" x2="${fmt(end.x)}" y2="${fmt(end.y)}" stroke="#d4d4d8" stroke-width="1"/>`);
    const text = radarPoint(i, n, 1, 16);
    const side = Math.abs(text.x - CENTER) < 1 ? "middle" : text.x > CENTER ? "start" : "end";
    parts.push(`<text x="${fmt(text.x)}" y="${fmt(text.y + 4)}" font-size="13" fill="#27272a" text-anchor="${side}">${escapeXml(label)}</text>`);
  });
  for (const s of series) {
    const points = poly((i) => clamp(s.values[i], max) / max);
    parts.push(`<polygon points="${points}" fill="${s.color}" fill-opacity="0.22" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"/>`);
    axes.forEach((_, i) => {
      const p = radarPoint(i, n, clamp(s.values[i], max) / max);
      parts.push(`<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="3.5" fill="${s.color}"/>`);
    });
  }
  // Legend only when there is more than one series to tell apart.
  if (series.length > 1) {
    series.forEach((s, i) => {
      const y = 22 + i * 18;
      parts.push(`<rect x="14" y="${y - 9}" width="12" height="12" fill="${s.color}"/>`, `<text x="32" y="${y + 1}" font-size="12" fill="#27272a">${escapeXml(s.name)}</text>`);
    });
  }
  parts.push("</svg>");
  return parts.join("");
}
