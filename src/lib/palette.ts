import { rgbToHex } from "./color";
import type { Rgb } from "./color";

export interface PaletteColor {
  rgb: Rgb;
  hex: string;
  /** Fraction of the sampled pixels that belong to this colour (0 to 1). */
  share: number;
}

const MAX_SAMPLES = 40000;

function widest(box: Rgb[]): { channel: 0 | 1 | 2; range: number } {
  let best: { channel: 0 | 1 | 2; range: number } = { channel: 0, range: -1 };
  for (const channel of [0, 1, 2] as const) {
    let min = 255;
    let max = 0;
    for (const px of box) {
      if (px[channel] < min) min = px[channel];
      if (px[channel] > max) max = px[channel];
    }
    if (max - min > best.range) best = { channel, range: max - min };
  }
  return best;
}

/** Dominant colours of RGBA pixel data, by median cut. Transparent pixels are ignored. */
export function extractPalette(data: Uint8ClampedArray | Uint8Array, count: number): PaletteColor[] {
  const step = Math.max(1, Math.floor(data.length / 4 / MAX_SAMPLES));
  const pixels: Rgb[] = [];
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (!pixels.length) return [];

  const boxes: Rgb[][] = [pixels];
  while (boxes.length < count) {
    let target = -1;
    let size = 1;
    boxes.forEach((box, i) => {
      if (box.length > size && widest(box).range > 0) {
        target = i;
        size = box.length;
      }
    });
    if (target < 0) break;
    const box = boxes[target];
    const { channel } = widest(box);
    box.sort((a, b) => a[channel] - b[channel]);
    const mid = box.length >> 1;
    boxes.splice(target, 1, box.slice(0, mid), box.slice(mid));
  }

  const shares = new Map<string, { rgb: Rgb; share: number }>();
  for (const box of boxes) {
    const sum = box.reduce<Rgb>((acc, px) => [acc[0] + px[0], acc[1] + px[1], acc[2] + px[2]], [0, 0, 0]);
    const rgb = sum.map((v) => Math.round(v / box.length)) as Rgb;
    const hex = rgbToHex(rgb);
    const known = shares.get(hex);
    if (known) known.share += box.length / pixels.length;
    else shares.set(hex, { rgb, share: box.length / pixels.length });
  }
  return [...shares.entries()]
    .map(([hex, v]) => ({ hex, rgb: v.rgb, share: v.share }))
    .sort((a, b) => b.share - a.share);
}

/** Index of the palette colour closest to rgb (squared distance in RGB). */
export function nearestIndex(palette: Rgb[], rgb: Rgb): number {
  let best = 0;
  let bestDistance = Infinity;
  palette.forEach((p, i) => {
    const d = (p[0] - rgb[0]) ** 2 + (p[1] - rgb[1]) ** 2 + (p[2] - rgb[2]) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}
