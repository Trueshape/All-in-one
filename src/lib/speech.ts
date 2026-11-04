/** Splits text into pieces of at most `max` characters, at sentence ends when possible. Long utterances make some browser voices stop halfway, so they are read piece by piece. */
export function splitForSpeech(text: string, max = 220): string[] {
  const pieces: string[] = [];
  for (const sentence of text.replace(/\s+/g, " ").trim().match(/[^.!?;:\n]+[.!?;:]*\s*|[.!?;:]+\s*/g) ?? []) {
    let rest = sentence.trim();
    while (rest.length > max) {
      const cut = rest.lastIndexOf(" ", max);
      const at = cut > max / 2 ? cut : max;
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
  }
  return pieces;
}
