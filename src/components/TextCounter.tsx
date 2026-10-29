import { useState } from "react";
import { Trash2 } from "lucide-react";
import { TextArea, Button, IconButton, CopyButton, SectionTitle, Stat, Stack } from "../ui/kit";

const WORDS_PER_MINUTE = 200;

export default function TextCounter() {
  const [text, setText] = useState("");

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = trimmed ? text.split("\n").length : 0;
  const sentences = trimmed ? text.split(/[.!?]+/).filter((s) => s.trim()).length : 0;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const seconds = Math.ceil((words / WORDS_PER_MINUTE) * 60);
  const reading = seconds < 60 ? `${seconds} sec` : `${Math.ceil(seconds / 60)} min`;

  const transforms: Array<{ label: string; run: (s: string) => string }> = [
    { label: "MAIUSCOLO", run: (s) => s.toUpperCase() },
    { label: "minuscolo", run: (s) => s.toLowerCase() },
    { label: "Capitalizza frasi", run: (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-zà-ü])/g, (m) => m.toUpperCase()) },
    { label: "Inverti testo", run: (s) => Array.from(s).reverse().join("") },
  ];

  return (
    <Stack>
      <div className="space-y-2">
        <SectionTitle
          right={
            <div className="flex gap-1">
              <IconButton onClick={() => setText("")} disabled={!text} title="Cancella tutto">
                <Trash2 className="w-4 h-4" />
              </IconButton>
              <CopyButton text={text} label="Copia testo" />
            </div>
          }
        >
          Editor di testo
        </SectionTitle>
        <TextArea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrivi o incolla qui il testo da contare e analizzare..." />
      </div>

      <div className="flex flex-wrap gap-2">
        {transforms.map((t) => (
          <Button key={t.label} size="sm" disabled={!text} onClick={() => setText(t.run(text))}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Parole" value={words} />
        <Stat label="Caratteri" value={text.length} />
        <Stat label="Senza spazi" value={charsNoSpaces} />
        <Stat label="Frasi" value={sentences} />
        <Stat label="Righe" value={lines} />
        <Stat label="Lettura stimata" value={reading} tone="warn" className="col-span-2 sm:col-span-1" />
      </div>
    </Stack>
  );
}
