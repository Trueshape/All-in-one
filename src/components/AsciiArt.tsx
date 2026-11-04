import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Field, TextArea, TextInput, Chips, Segmented, Slider, Toggle, Button, CopyButton, Panel, SectionTitle, Notice, Stack } from "../ui/kit";
import { DEFAULT_OPTIONS, asciiArt } from "../lib/asciiArt";
import type { AsciiAlign, AsciiComment, AsciiFont, AsciiFrame, AsciiStyle } from "../lib/asciiArt";
import { download } from "../lib/imageOps";

const FILLS = ["#", "█", "@", "*", "▓", "●"];

export default function AsciiArt() {
  const [text, setText] = useState("Ciao");
  const [fill, setFill] = useState(DEFAULT_OPTIONS.fill);
  const [scale, setScale] = useState(1);
  const [spacing, setSpacing] = useState(1);
  const [invert, setInvert] = useState(false);
  const [font, setFont] = useState<AsciiFont>("block");
  const [style, setStyle] = useState<AsciiStyle>("solid");
  const [align, setAlign] = useState<AsciiAlign>("left");
  const [frame, setFrame] = useState<AsciiFrame>("none");
  const [comment, setComment] = useState<AsciiComment>("none");

  const art = useMemo(
    () => asciiArt(text, { fill: fill || "#", scale, spacing, invert, font, style, align, frame, comment }),
    [text, fill, scale, spacing, invert, font, style, align, frame, comment],
  );

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,26rem)_1fr] gap-6">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Font">
              <Segmented fill value={font} onChange={setFont} options={[{ value: "block", label: "5×7" }, { value: "slim", label: "3×5" }]} />
            </Field>
            <Field label="Stile">
              <Segmented fill value={style} onChange={setStyle} options={[{ value: "solid", label: "Pieno" }, { value: "outline", label: "Contorno" }, { value: "shadow", label: "Ombra" }]} />
            </Field>
          </div>
          <Slider label="Dimensione" value={scale} min={1} max={3} onChange={setScale} display={`${scale}×`} />
          <Slider label="Spazio tra le lettere" value={spacing} min={0} max={3} onChange={setSpacing} />
          <Toggle checked={invert} onChange={setInvert} label="Inverti (disegna lo sfondo)" />
        </div>

        <div className="space-y-3 min-w-0">
          <SectionTitle right={<CopyButton text={art} />}>Risultato</SectionTitle>
          <Panel inset className="overflow-auto max-h-[300px] min-h-40">
            <pre className="font-mono text-sm leading-[1.15] whitespace-pre" aria-label="ASCII art">{art || " "}</pre>
          </Panel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Allineamento">
              <Segmented fill value={align} onChange={setAlign} options={[{ value: "left", label: "Sin." }, { value: "center", label: "Centro" }, { value: "right", label: "Des." }]} />
            </Field>
            <Field label="Cornice">
              <Segmented fill value={frame} onChange={setFrame} options={[{ value: "none", label: "No" }, { value: "simple", label: "+-+" }, { value: "double", label: "╔═╗" }]} />
            </Field>
            <Field label="Come commento" className="sm:col-span-2">
              <Segmented fill value={comment} onChange={setComment} options={[{ value: "none", label: "No" }, { value: "slashes", label: "//" }, { value: "hash", label: "#" }, { value: "block", label: "/* */" }]} />
            </Field>
          </div>
          <Button disabled={!art} icon={<Download className="w-3.5 h-3.5" />} onClick={() => download(new Blob([art + "\n"], { type: "text/plain;charset=utf-8" }), "ascii-art.txt")}>.txt</Button>
        </div>
      </div>
      <Notice>I font sono inclusi nel sito: le lettere accentate usano la forma della lettera base e i simboli non previsti diventano un "?". L'ombra usa "." o "░" a seconda del carattere scelto.</Notice>
    </Stack>
  );
}
