import { useMemo, useState } from "react";
import { Field, TextArea, TextInput, Chips, Slider, Toggle, CopyButton, Panel, SectionTitle, Notice, Stack } from "../ui/kit";
import { asciiArt } from "../lib/asciiArt";

const FILLS = ["#", "█", "@", "*", "▓", "●"];

export default function AsciiArt() {
  const [text, setText] = useState("Ciao");
  const [fill, setFill] = useState("#");
  const [scale, setScale] = useState(1);
  const [spacing, setSpacing] = useState(1);
  const [invert, setInvert] = useState(false);

  const art = useMemo(() => asciiArt(text, { fill: fill || "#", scale, spacing, invert }), [text, fill, scale, spacing, invert]);

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,20rem)_1fr] gap-6">
        <div className="space-y-4">
          <Field label="Testo" hint="Una riga per ogni blocco. Lettere, numeri e . , ! ? - + = : / ' ( )">
            <TextArea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Field label="Carattere">
            <div className="space-y-2">
              <Chips value={fill} onChange={setFill} options={FILLS.map((f) => ({ value: f, label: f }))} />
              <TextInput value={fill} maxLength={2} onChange={(e) => setFill(e.target.value)} aria-label="Carattere personalizzato" placeholder="Altro carattere" />
            </div>
          </Field>
          <Slider label="Dimensione" value={scale} min={1} max={3} onChange={setScale} display={`${scale}×`} />
          <Slider label="Spazio tra le lettere" value={spacing} min={0} max={3} onChange={setSpacing} />
          <Toggle checked={invert} onChange={setInvert} label="Inverti (disegna lo sfondo)" />
        </div>

        <div className="space-y-2 min-w-0">
          <SectionTitle right={<CopyButton text={art} />}>Risultato</SectionTitle>
          <Panel inset className="overflow-auto max-h-[420px] min-h-40">
            <pre className="font-mono text-sm leading-[1.15] whitespace-pre" aria-label="ASCII art">{art || " "}</pre>
          </Panel>
        </div>
      </div>
      <Notice>Il font è incluso nel sito (5 × 7 punti): le lettere accentate usano la forma della lettera base e i simboli non previsti diventano un "?".</Notice>
    </Stack>
  );
}
