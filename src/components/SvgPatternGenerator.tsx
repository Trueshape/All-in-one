import { useMemo, useState } from "react";
import { Download, Shuffle } from "lucide-react";
import { Field, TextInput, Chips, Slider, Toggle, Button, Panel, SectionTitle, Notice, Stack, CopyButton, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { PATTERN_TYPES, fitTile, patternSvg } from "../lib/pattern";
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
  const [fit, setFit] = useState(true);

  const w = Math.min(MAX_SIDE, Math.max(16, Math.round(Number(width)) || 800));
  const h = Math.min(MAX_SIDE, Math.max(16, Math.round(Number(height)) || 600));
  const svg = useMemo(() => patternSvg({ type, size, weight, rotation, fg, bg, width: w, height: h, fit }), [type, size, weight, rotation, fg, bg, w, h, fit]);
  const tileSize = fit ? fitTile(size, w, h) : size;
  const tilesAcross = Math.round((w / tileSize) * 100) / 100;
  const tilesDown = Math.round((h / tileSize) * 100) / 100;
  const exact = Number.isInteger(tilesAcross) && Number.isInteger(tilesDown);
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
      <div className="space-y-4">
        <Panel className="p-2">
          <img src={dataUrl} alt="Anteprima del pattern" className="w-full max-h-48 object-contain" style={{ aspectRatio: `${w} / ${h}` }} />
        </Panel>
        <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
          <Button variant="primary" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadSvg}>SVG</Button>
          <Button icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPng}>PNG</Button>
          <span className="flex items-center gap-1"><span className={cx("text-xs", u.muted)}>Codice</span><CopyButton text={svg} label="Copia codice SVG" /></span>
          <span className="flex items-center gap-1"><span className={cx("text-xs", u.muted)}>CSS</span><CopyButton text={css} label="Copia sfondo CSS" /></span>
        </div>

        <Field label="Motivo">
          <Chips value={type} onChange={setType} options={PATTERN_TYPES.map((t) => ({ value: t, label: LABELS[t] }))} />
        </Field>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Slider label="Modulo" value={size} min={8} max={120} onChange={setSize} display={`${size} px`} />
          <Slider label="Spessore" value={weight} min={1} max={10} onChange={setWeight} />
          <Slider label="Rotazione" value={rotation} min={0} max={180} step={5} onChange={setRotation} display={`${rotation}°`} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Motivo">
              <div className="flex items-center gap-2"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore motivo" /><span className={`font-mono text-[10px] ${u.subtle}`}>{fg.toUpperCase()}</span></div>
            </Field>
            <Field label="Sfondo">
              <div className="flex items-center gap-2"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore sfondo" /><span className={`font-mono text-[10px] ${u.subtle}`}>{bg.toUpperCase()}</span></div>
            </Field>
          </div>
          <Field label="Larghezza (px)"><TextInput type="number" min="16" max={MAX_SIDE} value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
          <Field label="Altezza (px)"><TextInput type="number" min="16" max={MAX_SIDE} value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        </div>
        <Toggle checked={fit} onChange={setFit} label="Adatta il modulo: nessun modulo tagliato ai bordi" />
        <p className={cx("text-xs font-mono", u.muted)}>
          Modulo {Math.round(tileSize * 100) / 100} px · {tilesAcross} × {tilesDown} moduli{exact ? "" : " (l'ultimo è tagliato)"}
          {rotation % 180 !== 0 && " · con la rotazione i bordi tagliano i moduli"}
        </p>
        <Button className="w-full" icon={<Shuffle className="w-3.5 h-3.5" />} onClick={shuffle}>Combinazione casuale</Button>
      </div>
      <Notice>Il pattern è un SVG: resta nitido a qualsiasi ingrandimento. Il PNG ha la dimensione indicata sopra.</Notice>
    </Stack>
  );
}
