import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Field, TextInput, Segmented, Slider, Toggle, Button, Panel, Notice, Stack, CopyButton, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { encodeBarcode } from "../lib/barcode";
import type { BarcodeType } from "../lib/barcode";
import { download, toBlob } from "../lib/imageOps";

const QUIET = 10;
const TEXT_HEIGHT = 14;

function barcodeSvg(modules: number[], label: string, height: number, showText: boolean, fg: string, bg: string): string {
  const width = modules.length + QUIET * 2;
  const total = height + (showText ? TEXT_HEIGHT : 0);
  let bars = "";
  for (let i = 0; i < modules.length; i++) {
    if (!modules[i]) continue;
    let end = i;
    while (modules[end + 1]) end++;
    bars += `M${QUIET + i} 0h${end - i + 1}v${height}h-${end - i + 1}z`;
    i = end;
  }
  const text = showText
    ? `<text x="${width / 2}" y="${height + TEXT_HEIGHT - 3}" font-family="monospace" font-size="10" text-anchor="middle" fill="${fg}">${label.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${total * 2}" viewBox="0 0 ${width} ${total}"><rect width="${width}" height="${total}" fill="${bg}"/><path d="${bars}" fill="${fg}" shape-rendering="crispEdges"/>${text}</svg>`;
}

export default function BarcodeGenerator() {
  const u = useUi();
  const [type, setType] = useState<BarcodeType>("code128");
  const [text, setText] = useState("ABC-12345");
  const [height, setHeight] = useState(60);
  const [showText, setShowText] = useState(true);
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");

  const encoded = useMemo(() => (text.trim() ? encodeBarcode(type, text) : null), [type, text]);
  const ok = encoded && "modules" in encoded ? encoded : null;
  const svg = ok ? barcodeSvg(ok.modules, ok.label, height, showText, fg, bg) : "";
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const downloadPng = () => {
    if (!ok) return;
    const image = new Image();
    image.onload = async () => {
      const scale = 4;
      const canvas = document.createElement("canvas");
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await toBlob(canvas, "image/png");
      if (blob) download(blob, `barcode_${type}.png`);
    };
    image.src = dataUrl;
  };

  return (
    <Stack>
      <Segmented fill value={type} onChange={setType} options={[{ value: "code128", label: "Code 128 (testo)" }, { value: "ean13", label: "EAN-13 (prodotti)" }]} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label={type === "ean13" ? "Cifre (12, oppure 13 con controllo)" : "Testo"} hint={type === "ean13" ? "La cifra di controllo viene calcolata da sola." : "Lettere, numeri e simboli ASCII."}>
            <TextInput value={text} onChange={(e) => setText(e.target.value)} inputMode={type === "ean13" ? "numeric" : "text"} spellCheck={false} />
          </Field>
          <Slider label="Altezza barre" value={height} min={30} max={120} onChange={setHeight} display={`${height}`} />
          <Toggle checked={showText} onChange={setShowText} label="Mostra il testo sotto le barre" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Colore barre">
              <div className="flex items-center gap-2"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore barre" /><span className={`font-mono text-xs ${u.subtle}`}>{fg.toUpperCase()}</span></div>
            </Field>
            <Field label="Colore sfondo">
              <div className="flex items-center gap-2"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore sfondo" /><span className={`font-mono text-xs ${u.subtle}`}>{bg.toUpperCase()}</span></div>
            </Field>
          </div>
        </div>

        <Panel className="flex flex-col items-center gap-4">
          <div className="w-full min-h-40 flex items-center justify-center" style={{ background: bg }}>
            {ok ? <img src={dataUrl} alt={`Codice a barre ${ok.label}`} className="max-w-full" /> : <span className={cx("text-xs", u.muted)}>Nessun contenuto</span>}
          </div>
          {encoded && "error" in encoded && <Notice tone="error">{encoded.error}</Notice>}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="primary" disabled={!ok} icon={<Download className="w-3.5 h-3.5" />} onClick={() => download(new Blob([svg], { type: "image/svg+xml" }), `barcode_${type}.svg`)}>SVG</Button>
            <Button disabled={!ok} icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPng}>PNG</Button>
          </div>
          {ok && <CopyButton text={ok.label} label="Copia testo codificato" />}
        </Panel>
      </div>
      <Notice>Il codice è generato nel browser. Per un uso commerciale (EAN/UPC) i numeri vanno assegnati da GS1.</Notice>
    </Stack>
  );
}
