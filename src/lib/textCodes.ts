/** Text <-> numeric byte codes (binary, hex, decimal, octal). Text goes through UTF-8, so accents and emoji round-trip. */

export type Base = 2 | 8 | 10 | 16;

export const BASES: Record<Base, { label: string; width: number }> = {
  2: { label: "Binario", width: 8 },
  16: { label: "Esadecimale", width: 2 },
  10: { label: "Decimale", width: 3 },
  8: { label: "Ottale", width: 3 },
};

const DIGITS: Record<Base, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i };

export function textToCodes(text: string, base: Base, separator = " "): string {
  const { width } = BASES[base];
  return Array.from(new TextEncoder().encode(text), (b) => b.toString(base).toUpperCase().padStart(width, "0")).join(separator);
}

export type Decoded = { ok: true; text: string } | { ok: false; error: string };

/** Accepts bytes separated by spaces, commas or newlines; hex may also carry a 0x prefix, and a single unseparated run is cut into fixed-width bytes. */
export function codesToText(codes: string, base: Base): Decoded {
  const cleaned = codes.trim();
  if (!cleaned) return { ok: true, text: "" };
  let parts = cleaned.split(/[\s,;]+/).filter(Boolean);
  if (base === 16) parts = parts.map((p) => p.replace(/^0x/i, ""));
  if (parts.length === 1 && parts[0].length > BASES[base].width && base !== 10) {
    const { width } = BASES[base];
    if (parts[0].length % width) return { ok: false, error: `Senza separatori la lunghezza deve essere multipla di ${width} cifre.` };
    parts = parts[0].match(new RegExp(`.{${width}}`, "g")) ?? [];
  }
  const bytes: number[] = [];
  for (const part of parts) {
    if (!DIGITS[base].test(part)) return { ok: false, error: `"${part}" non è un valore ${BASES[base].label.toLowerCase()} valido.` };
    const value = parseInt(part, base);
    if (value > 255) return { ok: false, error: `"${part}" supera un byte (massimo 255).` };
    bytes.push(value);
  }
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)) };
  } catch {
    return { ok: false, error: "I byte non formano un testo UTF-8 valido." };
  }
}
