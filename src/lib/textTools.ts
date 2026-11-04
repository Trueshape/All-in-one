export interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function findReplace(text: string, find: string, replacement: string, options: FindOptions): { result: string; count: number } | { error: string } {
  if (!find) return { result: text, count: 0 };
  let source = options.regex ? find : escapeRegex(find);
  if (options.wholeWord) source = `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`;
  let re: RegExp;
  try {
    re = new RegExp(source, `gu${options.caseSensitive ? "" : "i"}`);
  } catch {
    return { error: "Espressione regolare non valida." };
  }
  let count = 0;
  // A function replacement keeps "$1" literal unless the regex option is on.
  const result = text.replace(re, (...args) => {
    count++;
    if (!options.regex) return replacement;
    const groups = args.slice(1, args.findIndex((a) => typeof a === "number"));
    return replacement.replace(/\$(\d+|&)/g, (_, g: string) => (g === "&" ? args[0] : groups[Number(g) - 1] ?? ""));
  });
  return { result, count };
}

export interface DedupeOptions {
  caseSensitive: boolean;
  trim: boolean;
  skipEmpty: boolean;
}

/** Keeps the first occurrence of each line, in the original order. */
export function dedupeLines(text: string, options: DedupeOptions): { result: string; removed: number } {
  const seen = new Set<string>();
  const kept: string[] = [];
  let removed = 0;
  for (const line of text.split(/\r?\n/)) {
    if (options.skipEmpty && line.trim() === "") {
      removed++;
      continue;
    }
    let key = options.trim ? line.trim() : line;
    if (!options.caseSensitive) key = key.toLowerCase();
    if (seen.has(key)) removed++;
    else {
      seen.add(key);
      kept.push(options.trim ? line.trim() : line);
    }
  }
  return { result: kept.join("\n"), removed };
}

/** Fisher-Yates with crypto randomness. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  const buf = new Uint32Array(1);
  for (let i = a.length - 1; i > 0; i--) {
    let r: number;
    // Rejection sampling avoids modulo bias.
    const limit = 0x100000000 - (0x100000000 % (i + 1));
    do {
      crypto.getRandomValues(buf);
      r = buf[0];
    } while (r >= limit);
    const j = r % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
