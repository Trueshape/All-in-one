export type BarcodeType = "code128" | "ean13";

export type BarcodeResult = { modules: number[]; label: string } | { error: string };

// Code 128 bar/space widths for symbol values 0 to 106 (the last one is the stop symbol).
export const CODE128 =
  "212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112".split(" ");

const START_B = 104;
const STOP = 106;

const widthsToModules = (widths: string) =>
  [...widths].flatMap((w, i) => Array<number>(Number(w)).fill(i % 2 === 0 ? 1 : 0));

export function code128Checksum(text: string): number {
  let sum = START_B;
  [...text].forEach((ch, i) => {
    sum += (ch.charCodeAt(0) - 32) * (i + 1);
  });
  return sum % 103;
}

function encodeCode128(text: string): BarcodeResult {
  if (!text) return { error: "Inserisci il testo da codificare." };
  if (![...text].every((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126)) {
    return { error: "Code 128 accetta solo caratteri ASCII stampabili (niente lettere accentate o emoji)." };
  }
  const values = [START_B, ...[...text].map((ch) => ch.charCodeAt(0) - 32), code128Checksum(text), STOP];
  return { modules: values.flatMap((v) => widthsToModules(CODE128[v])), label: text };
}

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = L.map((code) => [...code].reverse().join(""));
const R = L.map((code) => [...code].map((bit) => (bit === "0" ? "1" : "0")).join(""));
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

export function ean13CheckDigit(digits12: string): number {
  const sum = [...digits12].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

/** EAN-13. A 12-digit input gets its check digit added; a 13-digit one must have a valid check digit. */
function encodeEan13(input: string): BarcodeResult {
  const text = input.replace(/\s/g, "");
  if (!/^\d+$/.test(text)) return { error: "EAN-13 accetta solo cifre." };
  if (text.length !== 12 && text.length !== 13) return { error: "Servono 12 cifre (la cifra di controllo viene aggiunta) o 13 cifre." };
  let digits = text;
  if (digits.length === 12) digits += ean13CheckDigit(digits);
  else if (ean13CheckDigit(digits.slice(0, 12)) !== Number(digits[12])) {
    return { error: `Cifra di controllo errata: dovrebbe essere ${ean13CheckDigit(digits.slice(0, 12))}.` };
  }
  const parity = PARITY[Number(digits[0])];
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === "L" ? L : G)[Number(digits[i])];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[Number(digits[i])];
  bits += "101";
  return { modules: [...bits].map(Number), label: digits };
}

export function encodeBarcode(type: BarcodeType, text: string): BarcodeResult {
  return type === "code128" ? encodeCode128(text) : encodeEan13(text);
}
