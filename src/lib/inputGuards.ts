/** Pure rules that keep what is typed, or pasted, inside the values a field can really hold. */

export interface NumberRules {
  /** Lowest value. Applied when the field is left, so "0.5" can still be typed in a field that starts at 0.1. */
  min?: number;
  /** Highest value. Applied while typing. */
  max?: number;
  /** Whole numbers only. */
  integer?: boolean;
  /** Most digits after the decimal point. */
  decimals?: number;
}

/**
 * Keys a number field refuses. The browser lets a number field take "e" and "+" (exponents), so they are blocked here;
 * the minus sign goes when the field cannot be below zero, the decimal marks when it holds whole numbers.
 */
export function blockedNumberKey(key: string, rules: NumberRules): boolean {
  if (key === "e" || key === "E" || key === "+") return true;
  if (key === "-" && rules.min !== undefined && rules.min >= 0) return true;
  if ((key === "." || key === ",") && rules.integer) return true;
  return false;
}

/** The text of a number field after the rules that apply while typing: no exponent, no sign below zero, no extra decimals, never above the maximum. */
export function limitNumber(text: string, rules: NumberRules): string {
  if (text === "") return text;
  let out = text.replace(/[eE+].*$/, "");
  if (rules.min !== undefined && rules.min >= 0) out = out.replace(/^-/, "");
  if (rules.integer) out = out.replace(/[.,].*$/, "");
  else if (rules.decimals !== undefined) {
    const at = out.search(/[.,]/);
    if (at >= 0) out = out.slice(0, at + 1) + out.slice(at + 1, at + 1 + rules.decimals);
    if (rules.decimals === 0) out = out.slice(0, at);
  }
  const n = Number(out);
  if (rules.max !== undefined && Number.isFinite(n) && n > rules.max) return String(rules.max);
  return out;
}

/** The text of a number field when it is left: a value below the minimum becomes the minimum. */
export function settleNumber(text: string, rules: NumberRules): string {
  if (text === "") return text;
  const n = Number(text);
  if (!Number.isFinite(n)) return "";
  if (rules.min !== undefined && n < rules.min) return String(rules.min);
  return text;
}

/** Keeps only the characters `allow` accepts (a regular expression without the `g` flag, tested on one character at a time), and at most `maxLength` of them. */
export function keepAllowed(text: string, allow: RegExp, maxLength?: number): string {
  let out = "";
  for (const ch of text) if (allow.test(ch)) out += ch;
  return maxLength === undefined ? out : out.slice(0, maxLength);
}

/** Ready-made character sets for the `allow` prop of `TextInput` and `TextArea`. */
export const ALLOW = {
  digits: /[0-9]/,
  /** Page lists and ranges such as "1-3, 5". */
  pages: /[0-9,;\- ]/,
  /** A track number, optionally out of a total: "3" or "3/12". */
  trackNumber: /[0-9/]/,
  personName: /[\p{L} '’-]/u,
  lettersDigits: /[A-Za-z0-9]/,
  lettersDigitsSpace: /[A-Za-z0-9 ]/,
  hexColor: /[#0-9a-fA-F]/,
  /** What Code 128 can draw: printable ASCII. */
  asciiPrintable: /[\x20-\x7e]/,
  morse: /[.\-/·•–—−_\s]/,
  roman: /[IVXLCDMivxlcdm]/,
  /** A time such as "5" or "25:00". */
  clock: /[0-9:]/,
  /** A name for a PDF form field: no dot, which PDF reads as a group separator. */
  fieldName: /[^.]/,
  fontName: /[\p{L}\p{N} _-]/u,
} as const;
