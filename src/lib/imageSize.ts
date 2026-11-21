import { MAX_SIDE } from "./imageOps";

/** The other side of an image resized with locked proportions; null when `value` is not a positive number. */
export function otherSide(value: string, side: "width" | "height", image: { width: number; height: number }): string | null {
  const n = parseFloat(value);
  if (!(n > 0)) return null;
  return String(Math.round(side === "width" ? (n * image.height) / image.width : (n * image.width) / image.height));
}

/** Why a target size cannot be saved, or null when it can. ICO files stop at 256 px. */
export function sizeError(w: number, h: number, ico: boolean): string | null {
  if (!(w > 0 && h > 0) || w > MAX_SIDE || h > MAX_SIDE) return `Dimensioni non valide: usa valori tra 1 e ${MAX_SIDE} px.`;
  if (ico && (w > 256 || h > 256)) return "Il formato ICO arriva a 256 × 256 px: riduci larghezza e altezza.";
  return null;
}
