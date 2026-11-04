const PAIRS: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

export const MAX_ROMAN = 3999;

export function toRoman(n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > MAX_ROMAN) return null;
  let rest = n;
  let out = "";
  for (const [value, symbol] of PAIRS) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

/** Only canonical numerals count: "IIII" or "VX" are rejected, so every valid input round-trips. */
export function fromRoman(text: string): number | null {
  const s = text.trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(s)) return null;
  let n = 0;
  let rest = s;
  for (const [value, symbol] of PAIRS) {
    while (rest.startsWith(symbol)) {
      n += value;
      rest = rest.slice(symbol.length);
    }
  }
  return rest === "" && toRoman(n) === s ? n : null;
}
