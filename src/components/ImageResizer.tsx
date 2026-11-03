import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Field, TextInput, Toggle, Chips, Segmented, Slider, Button, IconButton, Panel, SectionTitle, Notice, Stack, Row, cx } from "../ui/kit";
import { ImageDrop, useImageSource } from "../ui/ImageDrop";
import { useUi } from "../ui/tokens";
import { MAX_PIXELS, MAX_SIDE, download, formatBytes, resample, toBlob } from "../lib/imageOps";

type Mode = "size" | "quality" | "both";
type Format = "jpeg" | "webp" | "png";

const EXTENSION: Record<Format, string> = { jpeg: "jpg", webp: "webp", png: "png" };

interface Result {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export default function ImageResizer() {
  const u = useUi();
  const { source, error, setError, load, clear } = useImageSource();
  const [mode, setMode] = useState<Mode>("size");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState<Format>("webp");
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!source) return;
    setWidth(String(source.width));
    setHeight(String(source.height));
    setFormat(source.type === "image/png" ? "png" : source.type === "image/webp" ? "webp" : "jpeg");
  }, [source]);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const resizes = mode !== "quality";
  const compresses = mode !== "size" && format !== "png";
  const outW = !source ? 0 : resizes ? Math.round(Number(width)) : source.width;
  const outH = !source ? 0 : resizes ? Math.round(Number(height)) : source.height;
  const valid = !!source && outW >= 1 && outH >= 1 && outW <= MAX_SIDE && outH <= MAX_SIDE && outW * outH <= MAX_PIXELS;

  // The result follows the options: recomputed shortly after the last change.
  useEffect(() => {
    if (!source || !valid) {
      setResult(null);
      return;
    }
    let stale = false;
    const timer = window.setTimeout(async () => {
      try {
        let canvas = resample(source.image, outW, outH);
        if (format === "jpeg") {
          // JPEG has no transparency: flatten over white.
          const flat = document.createElement("canvas");
          flat.width = canvas.width;
          flat.height = canvas.height;
          const ctx = flat.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, flat.width, flat.height);
            ctx.drawImage(canvas, 0, 0);
            canvas = flat;
          }
        }
        const blob = await toBlob(canvas, `image/${format}`, compresses ? quality / 100 : format === "png" ? undefined : 0.92);
        if (stale) return;
        if (!blob || blob.type !== `image/${format}`) {
          setError("Questo browser non supporta il formato scelto.");
          setResult(null);
          return;
        }
        setError(null);
        setResult({ blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height });
      } catch (e) {
        if (!stale) setError(e instanceof Error ? e.message : "Elaborazione non riuscita.");
      }
    }, 250);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [source, valid, outW, outH, format, quality, compresses, setError]);

  const onWidth = (value: string) => {
    setWidth(value);
    const w = parseFloat(value);
    if (lock && source && w > 0) setHeight(String(Math.round((w * source.height) / source.width)));
  };
  const onHeight = (value: string) => {
    setHeight(value);
    const h = parseFloat(value);
    if (lock && source && h > 0) setWidth(String(Math.round((h * source.width) / source.height)));
  };
  const percent = (p: number) => {
    if (!source) return;
    setWidth(String(Math.max(1, Math.round((source.width * p) / 100))));
    setHeight(String(Math.max(1, Math.round((source.height * p) / 100))));
  };

  const saving = source && result ? Math.round((1 - result.blob.size / source.size) * 100) : null;

  return (
    <Stack>
      <Segmented
        fill
        value={mode}
        onChange={setMode}
        options={[{ value: "size", label: "Risoluzione" }, { value: "quality", label: "Qualità" }, { value: "both", label: "Entrambe" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SectionTitle right={source && <IconButton onClick={() => { clear(); setResult(null); }} title="Rimuovi immagine"><Trash2 className="w-4 h-4" /></IconButton>}>Immagine</SectionTitle>
          {!source ? (
            <ImageDrop onFile={load} />
          ) : (
            <Panel className="space-y-3">
              <div className="h-44 flex items-center justify-center">
                <img src={result?.url ?? source.url} alt="Anteprima" className="max-h-44 max-w-full object-contain" />
              </div>
              <div className={cx("pt-3 border-t space-y-1.5", u.divider)}>
                <Row label="Originale" value={`${source.width} × ${source.height} px · ${formatBytes(source.size)}`} />
                {result && <Row label="Risultato" value={`${result.width} × ${result.height} px · ${formatBytes(result.blob.size)}`} />}
                {saving !== null && <Row label="Peso" value={saving >= 0 ? `-${saving}%` : `+${-saving}%`} tone={saving > 0 ? "good" : "warn"} />}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Opzioni</SectionTitle>
          {resizes && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Larghezza (px)"><TextInput type="number" min="1" max={MAX_SIDE} disabled={!source} value={width} onChange={(e) => onWidth(e.target.value)} /></Field>
                <Field label="Altezza (px)"><TextInput type="number" min="1" max={MAX_SIDE} disabled={!source} value={height} onChange={(e) => onHeight(e.target.value)} /></Field>
              </div>
              <Toggle checked={lock} onChange={setLock} label="Mantieni proporzioni" />
              <div className="flex flex-wrap gap-1.5">
                {[25, 50, 75].map((p) => <button type="button" key={p} disabled={!source} onClick={() => percent(p)} className={u.chip}>{p}%</button>)}
              </div>
            </>
          )}
          <Field label="Formato">
            <Chips fill value={format} onChange={setFormat} options={[{ value: "jpeg", label: "JPG" }, { value: "webp", label: "WEBP" }, { value: "png", label: "PNG" }]} />
          </Field>
          {mode !== "size" && format !== "png" && <Slider label="Qualità" value={quality} min={10} max={100} onChange={setQuality} display={`${quality}%`} />}
          {mode !== "size" && format === "png" && <Notice tone="warn">Il PNG non perde qualità: per ridurre il peso scegli JPG o WEBP.</Notice>}
          {source && !valid && <Notice tone="error">Dimensioni non valide: lato massimo {MAX_SIDE} px.</Notice>}
          <Button variant="primary" className="w-full" disabled={!result} icon={<Download className="w-3.5 h-3.5" />} onClick={() => result && source && download(result.blob, `${source.name}_${result.width}x${result.height}.${EXTENSION[format]}`)}>
            Scarica
          </Button>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>Tutto avviene nel browser: nessun file viene inviato a server esterni.</Notice>
    </Stack>
  );
}
