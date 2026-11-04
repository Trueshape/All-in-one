import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Field, Chips, Slider, Button, IconButton, Panel, SectionTitle, Notice, Stack, Row, cx } from "../ui/kit";
import { ImageDrop } from "../ui/ImageDrop";
import type { ImageSourceState } from "../ui/ImageDrop";
import { useUi } from "../ui/tokens";
import { MAX_SIDE, adjust, download, formatBytes, readPixels, resample, sharpen, toBlob, writePixels } from "../lib/imageOps";

type Format = "png" | "webp" | "jpeg";

/** Sharpening runs on every pixel, so keep the output to a size that finishes in a few seconds. */
const MAX_OUTPUT_PIXELS = 36_000_000;

interface Result {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export default function ImageUpscaler({ image }: { image: ImageSourceState }) {
  const u = useUi();
  const { source, error, setError, load, clear } = image;
  const [scale, setScale] = useState(2);
  const [sharp, setSharp] = useState(40);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => setResult(null), [source]);

  const outW = source ? source.width * scale : 0;
  const outH = source ? source.height * scale : 0;
  const tooBig = !!source && (outW > MAX_SIDE || outH > MAX_SIDE || outW * outH > MAX_OUTPUT_PIXELS);

  const run = () => {
    if (!source || tooBig) return;
    setBusy(true);
    setError(null);
    // Let the "working" state paint before the heavy loop blocks the page.
    window.setTimeout(async () => {
      try {
        const canvas = resample(source.image, outW, outH);
        const pixels = readPixels(canvas);
        sharpen(pixels, sharp / 50);
        adjust(pixels, { brightness, contrast, saturation });
        writePixels(canvas, pixels);
        let out = canvas;
        if (format === "jpeg") {
          out = document.createElement("canvas");
          out.width = canvas.width;
          out.height = canvas.height;
          const ctx = out.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, out.width, out.height);
            ctx.drawImage(canvas, 0, 0);
          }
        }
        const blob = await toBlob(out, `image/${format}`, format === "png" ? undefined : 0.95);
        if (!blob || blob.type !== `image/${format}`) throw new Error("Questo browser non supporta il formato scelto.");
        setResult({ blob, url: URL.createObjectURL(blob), width: out.width, height: out.height });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Elaborazione non riuscita.");
      } finally {
        setBusy(false);
      }
    }, 30);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SectionTitle right={source && <IconButton onClick={clear} title="Rimuovi immagine"><Trash2 className="w-4 h-4" /></IconButton>}>Immagine</SectionTitle>
          {!source ? (
            <ImageDrop onFile={load} />
          ) : (
            <Panel className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <figure className="space-y-1">
                  <div className="h-36 flex items-center justify-center"><img src={source.url} alt="Originale" className="max-h-36 max-w-full object-contain" /></div>
                  <figcaption className={cx("text-center", u.statLabel)}>Prima</figcaption>
                </figure>
                <figure className="space-y-1">
                  <div className="h-36 flex items-center justify-center">
                    {result ? <img src={result.url} alt="Ingrandita" className="max-h-36 max-w-full object-contain" /> : <span className={cx("text-xs", u.muted)}>—</span>}
                  </div>
                  <figcaption className={cx("text-center", u.statLabel)}>Dopo</figcaption>
                </figure>
              </div>
              <div className={cx("pt-3 border-t space-y-1.5", u.divider)}>
                <Row label="Originale" value={`${source.width} × ${source.height} px`} />
                <Row label="Nuova dimensione" value={`${outW} × ${outH} px`} tone={tooBig ? "bad" : undefined} />
                {result && <Row label="File" value={formatBytes(result.blob.size)} />}
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Opzioni</SectionTitle>
          <Field label="Ingrandimento">
            <Chips fill value={scale} onChange={setScale} options={[{ value: 2, label: "×2" }, { value: 3, label: "×3" }, { value: 4, label: "×4" }]} />
          </Field>
          <Slider label="Nitidezza" value={sharp} min={0} max={100} onChange={setSharp} display={`${sharp}%`} />
          <Slider label="Luminosità" value={brightness} min={-100} max={100} onChange={setBrightness} />
          <Slider label="Contrasto" value={contrast} min={-100} max={100} onChange={setContrast} />
          <Slider label="Saturazione" value={saturation} min={-100} max={100} onChange={setSaturation} />
          <Field label="Formato">
            <Chips fill value={format} onChange={setFormat} options={[{ value: "png", label: "PNG" }, { value: "webp", label: "WEBP" }, { value: "jpeg", label: "JPG" }]} />
          </Field>
          {tooBig && <Notice tone="error">Troppo grande: scegli un ingrandimento minore (lato massimo {MAX_SIDE} px).</Notice>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" disabled={!source || busy || tooBig} onClick={run}>{busy ? "Elaborazione..." : "Ingrandisci"}</Button>
            <Button disabled={!result} icon={<Download className="w-3.5 h-3.5" />} onClick={() => result && source && download(result.blob, `${source.name}_x${scale}.${format === "jpeg" ? "jpg" : format}`)}>{(format === "jpeg" ? "jpg" : format).toUpperCase()}</Button>
          </div>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>L'ingrandimento è fatto nel browser con ricampionamento di alta qualità, a passi di ×2, più nitidezza: non inventa dettagli come un modello di intelligenza artificiale. Filtri e nitidezza si applicano dopo l'ingrandimento, sull'immagine già grande.</Notice>
    </Stack>
  );
}
