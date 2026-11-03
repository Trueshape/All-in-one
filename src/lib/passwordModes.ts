import { WORDS } from "./wordlist";

/** Uniform random integer in [0, max) using crypto.getRandomValues with rejection sampling. */
export function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

const pick = <T,>(list: ArrayLike<T>) => list[randomInt(list.length)];

export const PASSPHRASE_BITS_PER_WORD = Math.log2(WORDS.length);

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  /** Append a random digit group, like "-42". */
  number: boolean;
}

export function passphrase({ words, separator, capitalize, number }: PassphraseOptions): string {
  const list = Array.from({ length: words }, () => {
    const word = pick(WORDS);
    return capitalize ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (number) list.push(String(randomInt(100)).padStart(2, "0"));
  return list.join(separator);
}

const CONSONANTS = "bcdfglmnprstvz";
const VOWELS = "aeiou";
export const PRONOUNCEABLE_BITS = (length: number) =>
  Math.ceil(length / 2) * Math.log2(CONSONANTS.length) + Math.floor(length / 2) * Math.log2(VOWELS.length);

/** Alternating consonants and vowels: easy to read aloud and to remember. */
export function pronounceable(length: number, capitalize: boolean): string {
  const chars = Array.from({ length }, (_, i) => pick(i % 2 === 0 ? CONSONANTS : VOWELS));
  if (capitalize && chars.length) chars[0] = chars[0].toUpperCase();
  return chars.join("");
}

export function pin(length: number): string {
  return Array.from({ length }, () => randomInt(10)).join("");
}

export type TokenFormat = "hex" | "base64url";

export function token(bytes: number, format: TokenFormat): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  if (format === "hex") return [...data].map((b) => b.toString(16).padStart(2, "0")).join("");
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
