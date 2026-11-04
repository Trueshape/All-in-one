const TABLE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
  ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", _: "..--.-", '"': ".-..-.", $: "...-..-", "@": ".--.-.",
};
const REVERSE = new Map(Object.entries(TABLE).map(([char, code]) => [code, char]));

/** Letters are separated by a space and words by " / ". Accents are dropped (è → E); anything with no code is skipped and counted. */
export function textToMorse(text: string): { code: string; skipped: number } {
  let skipped = 0;
  const words = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      [...word]
        .map((char) => {
          const code = TABLE[char];
          if (!code) skipped++;
          return code;
        })
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean);
  return { code: words.join(" / "), skipped };
}

/** Accepts "." or "·" for dots and "-" or "–" for dashes; "/" or three spaces between words. */
export function morseToText(code: string): { text: string; unknown: number } {
  let unknown = 0;
  const normalized = code.replace(/[·•]/g, ".").replace(/[–—−_]/g, "-");
  const text = normalized
    .split(/\s*\/\s*|\s{3,}|\n+/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((letter) => {
          const char = REVERSE.get(letter);
          if (!char) unknown++;
          return char ?? "?";
        })
        .join(""),
    )
    .filter(Boolean)
    .join(" ");
  return { text, unknown };
}
