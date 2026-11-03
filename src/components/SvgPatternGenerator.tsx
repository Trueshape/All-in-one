import { useMemo, useState } from "react";
import { Download, Shuffle } from "lucide-react";
import { Field, TextInput, Chips, Slider, Button, Panel, SectionTitle, Notice, Stack, CopyButton, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { PATTERN_TYPES, patternSvg } from "../lib/pattern";
import type { PatternType } from "../lib/pattern";
import { download, toBlob } from "../lib/imageOps";

const LABELS: Record<PatternType, string> = {
  dots: "Pois",
  grid: "Griglia",
  diagonal: "Diagonali",
  waves: "Onde",
  chevron: "Chevron",
  triangles: "Triangoli",
  checker: "Scacchi",
  plus: "Croci",
};

const MAX_SIDE = 4096;

const randomHex = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");

export default function SvgPatternGenerator() {
  const u = useUi();
  const [type, setType] = useState<PatternType>("dots");
  const [size, setSize] = useState(32);
  const [weight, setWeight] = useState(4);
  const [rotation, setRotation] = useState(0);
  const [fg, setFg] = useState("#8b5cf6");
  const [bg, setBg] = useState("#18181b");
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("600");

  const w = Math.min(MAX_SIDE, Math.max(16, Math.round(Number(width)) || 800));
  const h = Math.min(MAX_SIDE, Math.max(16, Math.round(Number(height)) || 600));
  const svg = useMemo(() => patternSvg({ type, size, weight, rotation, fg, bg, width: w, height: h }), [type, size, weight, rotation, fg, bg, w, h]);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const css = `background-image: url("${dataUrl}");`;

  const shuffle = () => {
    setType(PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)]);
    setFg(randomHex());
    setBg(randomHex());
    setSize(16 + Math.floor(Math.random() * 64));
    setRotation(Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 36) * 5);
  };

  const downloadSvg = () => download(new Blob([svg], { type: "image/svg+xml" }), `pattern_${type}.svg`);

  const downloadPng = () => {
    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(image, 0, 0, w, h);
      const blob = await toBlob(canvas, "image/png");
      if (blob) download(blob, `pattern_${type}.png`);
    };
    image.src = dataUrl;
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Motivo">
            <Chips value={type} onChange={setType} options={PATTERN_TYPES.map((t) => ({ value: t, label: LABELS[t] }))} />
          </Field>
          <Slider label="Dimensione del modulo" value={size} min={8} max={120} onChange={setSize} display={`${size} px`} />
          <Slider label="Spessore / dimensione forme" value={weight} min={1} max={10} onChange={setWeight} />
          <Slider label="Rotazione" value={rotation} min={0} max={180} step={5} onChange={setRotation} display={`${rotation}°`} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colore motivo">
              <div className="flex items-center gap-2"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore motivo" /><span className={`font-mono text-xs ${u.subtle}`}>{fg.toUpperCase()}</span></div>
            </Field>
            <Field label="Colore sfondo">
              <div className="flex items-center gap-2"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore sfondo" /><span className={`font-mono text-xs ${u.subtle}`}>{bg.toUpperCase()}</span></div>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Larghezza (px)"><TextInput type="number" min="16" max={MAX_SIDE} value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
            <Field label="Altezza (px)"><TextInput type="number" min="16" max={MAX_SIDE} value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
          </div>
          <Button className="w-full" icon={<Shuffle className="w-3.5 h-3.5" />} onClick={shuffle}>Combinazione casuale</Button>
        </div>

        <div className="space-y-3">
          <SectionTitle>Anteprima</SectionTitle>
          <Panel className="p-2">
            <img src={dataUrl} alt="Anteprima del pattern" className="w-full h-64 object-cover" />
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadSvg}>Scarica SVG</Button>
            <Button icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPng}>Scarica PNG</Button>
          </div>
          <div className="flex items-center justify-between">
            <span className={cx("text-xs", u.muted)}>Codice SVG</span>
            <CopyButton text={svg} label="Copia codice SVG" />
          </div>
          <div className="flex items-center justify-between">
            <span className={cx("text-xs", u.muted)}>Sfondo CSS</span>
            <CopyButton text={css} label="Copia sfondo CSS" />
          </div>
        </div>
      </div>
      <Notice>Il pattern è un SVG: resta nitido a qualsiasi ingrandimento. Il PNG ha la dimensione indicata sopra.</Notice>
    </Stack>
  );
}
