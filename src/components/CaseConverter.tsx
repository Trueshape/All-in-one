import { useState } from "react";
import { Trash2 } from "lucide-react";
import { TextArea, Button, IconButton, CopyButton, SectionTitle, Stat, Panel, Stack } from "../ui/kit";

const SAMPLE = "Converti questo testo di esempio in diversi formati. Analizza anche le statistiche della lettura.";

/** Removes accents and splits text into lowercase alphanumeric words (for camel/snake/kebab). */
const words = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const CONVERSIONS: Array<{ label: string; run: (s: string) => string }> = [
  { label: "MAIUSCOLO", run: (s) => s.toUpperCase() },
  { label: "minuscolo", run: (s) => s.toLowerCase() },
  {
    label: "Title Case",
    run: (s) => s.toLowerCase().replace(/(^|\s)(\S)/g, (_, space, ch) => space + ch.toUpperCase()),
  },
  {
    label: "Sentence case",
    run: (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\S)/g, (_, lead, ch) => lead + ch.toUpperCase()),
  },
  {
    label: "camelCase",
    run: (s) => words(s).map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join(""),
  },
  { label: "snake_case", run: (s) => words(s).join("_") },
  { label: "kebab-case", run: (s) => words(s).join("-") },
  { label: "AlTeRnAtO", run: (s) => Array.from(s).map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join("") },
];

export default function CaseConverter() {
  const [text, setText] = useState("");

  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  const lines = text ? text.split("\n").filter((l) => l.trim()).length : 0;

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-7 space-y-2">
          <SectionTitle
            right={
              <div className="flex items-center gap-1">
                <Button size="sm" onClick={() => setText(SAMPLE)}>Esempio</Button>
                <IconButton onClick={() => setText("")} disabled={!text} title="Pulisci">
                  <Trash2 className="w-4 h-4" />
                </IconButton>
                <CopyButton text={text} label="Copia testo" />
              </div>
            }
          >
            Testo
          </SectionTitle>
          <TextArea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrivi o incolla qui il testo da convertire..." />
        </div>

        <div className="md:col-span-5 space-y-2">
          <SectionTitle>Conversioni</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {CONVERSIONS.map((c) => (
              <Button key={c.label} size="sm" disabled={!text} onClick={() => setText(c.run(text))}>
                {c.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Panel>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Stat label="Caratteri" value={text.length} />
          <Stat label="Senza spazi" value={text.replace(/\s/g, "").length} />
          <Stat label="Parole" value={wordCount} />
          <Stat label="Frasi" value={sentences} />
          <Stat label="Righe" value={lines} />
        </div>
      </Panel>
    </Stack>
  );
}
