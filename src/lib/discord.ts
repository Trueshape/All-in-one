const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });

/** "tra 3 giorni", "ieri", "2 ore fa": the largest unit that fits, like Discord's relative timestamps. */
export function relative(d: Date, now = Date.now()): string {
  const seconds = Math.round((d.getTime() - now) / 1000);
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [["year", 31_536_000], ["month", 2_592_000], ["day", 86_400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}

export const MARKUP: Array<{ id: string; label: string; wrap: (s: string) => string }> = [
  { id: "bold", label: "Grassetto", wrap: (s) => `**${s}**` },
  { id: "italic", label: "Corsivo", wrap: (s) => `*${s}*` },
  { id: "underline", label: "Sottolineato", wrap: (s) => `__${s}__` },
  { id: "strike", label: "Barrato", wrap: (s) => `~~${s}~~` },
  { id: "spoiler", label: "Spoiler", wrap: (s) => `||${s}||` },
  { id: "code", label: "Codice", wrap: (s) => `\`${s}\`` },
  { id: "block", label: "Blocco codice", wrap: (s) => `\`\`\`\n${s}\n\`\`\`` },
  { id: "quote", label: "Citazione", wrap: (s) => s.split("\n").map((l) => `> ${l}`).join("\n") },
  { id: "header", label: "Titolo", wrap: (s) => `# ${s}` },
  { id: "subtext", label: "Sottotesto", wrap: (s) => `-# ${s}` },
  { id: "silent", label: "Link senza anteprima", wrap: (s) => `<${s}>` },
];
