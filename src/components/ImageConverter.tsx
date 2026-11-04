import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Field, TextInput, Toggle, Chips, Slider, Button, IconButton, Panel, SectionTitle, Notice, Stack, Row, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { ImageDrop } from "../ui/ImageDrop";
import type { ImageSourceState } from "../ui/ImageDrop";
import { encodeBmp, encodeGif, encodeIco, encodeTiff } from "../lib/imageEncoders";
import { MAX_SIDE, formatBytes } from "../lib/imageOps";

type Format = "jpeg" | "png" | "webp" | "gif" | "avif" | "bmp" | "tiff" | "ico";

const EXTENSION: Record<Format, string> = { jpeg: "jpg", png: "png", webp: "webp", gif: "gif", avif: "avif", bmp: "bmp", tiff: "tif", ico: "ico" };
const FORMATS: Array<{ value: Format; label: string }> = [
  { value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }, { value: "webp", label: "WEBP" },
  { value: "gif", label: "GIF" }, { value: "avif", label: "AVIF" }, { value: "bmp", label: "BMP" }, { value: "tiff", label: "TIFF" }, { value: "ico", label: "ICO" },
];
const LOSSY: Format[] = ["jpeg", "webp", "avif"];

/** Browsers that cannot encode AVIF hand back a PNG, so the chip is shown only where it works. */
function useAvifSupport() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    canvas.toBlob((blob) => setSupported(blob?.type === "image/avif"), "image/avif");
  }, []);
  return supported;
}

export default function ImageConverter({ image }: { image: ImageSourceState }) {
  const u = useUi();
  const { source, error, setError, load, clear } = image;
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState<Format>("jpeg");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const avif = useAvifSupport();
  const [outputSize, setOutputSize] = useState<number | null>(null);

  // A new image (or none) resets the size fields.
  useEffect(() => {
    setWidth(source ? String(source.width) : "");
    setHeight(source ? String(source.height) : "");
    setOutputSize(null);
  }, [source]);

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

  const save = () => {
    if (!source) return;
    const w = Math.round(parseFloat(width));
    const h = Math.round(parseFloat(height));
    if (!(w > 0 && h > 0) || w > MAX_SIDE || h > MAX_SIDE) {
      setError(`Dimensioni non valide: usa valori tra 1 e ${MAX_SIDE} px.`);
      return;
    }
    if (format === "ico" && (w > 256 || h > 256)) {
      setError("Il formato ICO arriva a 256 × 256 px: riduci larghezza e altezza.");
      return;
    }
    setError(null);
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      setError("Canvas non disponibile in questo browser.");
      return;
    }
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(source.image, 0, 0, w, h);
    const done = (blob: Blob | null) => {
      setBusy(false);
      if (!blob) {
        setError("Questo browser non supporta il formato scelto.");
        return;
      }
      setOutputSize(blob.size);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${source.name}_convertito.${EXTENSION[format]}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (format === "bmp" || format === "tiff" || format === "gif") {
      const pixels = ctx.getImageData(0, 0, w, h);
      const encode = { bmp: encodeBmp, tiff: encodeTiff, gif: encodeGif }[format];
      done(new Blob([encode(pixels)], { type: `image/${format}` }));
      return;
    }
    const mime = format === "ico" ? "image/png" : `image/${format}`;
    canvas.toBlob(
      async (blob) => {
        // A type the browser cannot encode silently comes back as PNG.
        if (!blob || blob.type !== mime) return done(null);
        done(format === "ico" ? new Blob([encodeIco(new Uint8Array(await blob.arrayBuffer()), w, h)], { type: "image/x-icon" }) : blob);
      },
      mime,
      LOSSY.includes(format) ? quality / 100 : undefined,
    );
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
              <div className="h-44 flex items-center justify-center">
                <img src={source.url} alt="Anteprima dell'immagine caricata" className="max-h-44 max-w-full object-contain" />
              </div>
              <div className={cx("pt-3 border-t space-y-1.5", u.divider)}>
                <Row label="Risoluzione" value={`${source.width} × ${source.height} px`} />
                <Row label="Peso" value={formatBytes(source.size)} />
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Opzioni</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Larghezza (px)"><TextInput type="number" min="1" max={MAX_SIDE} disabled={!source} value={width} onChange={(e) => onWidth(e.target.value)} /></Field>
            <Field label="Altezza (px)"><TextInput type="number" min="1" max={MAX_SIDE} disabled={!source} value={height} onChange={(e) => onHeight(e.target.value)} /></Field>
          </div>
          <Toggle checked={lock} onChange={setLock} label="Mantieni proporzioni" />
          <Field label="Formato">
            <Chips value={format} onChange={setFormat} options={FORMATS.filter((f) => f.value !== "avif" || avif)} />
          </Field>
          {LOSSY.includes(format) && <Slider label="Qualità" value={quality} min={10} max={100} onChange={setQuality} display={`${quality}%`} />}
          <Button variant="primary" className="w-full" disabled={!source || busy} icon={<Download className="w-3.5 h-3.5" />} onClick={save}>
            {busy ? "Elaborazione..." : "Converti"}
          </Button>
          {outputSize !== null && <p className={cx("text-xs", u.muted)}>File generato: {formatBytes(outputSize)}</p>}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>La conversione avviene interamente nel browser: nessun file viene inviato a server esterni.</Notice>
    </Stack>
  );
}
