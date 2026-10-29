import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Download, ImagePlus, Trash2 } from "lucide-react";
import { Field, TextInput, Toggle, Chips, Slider, Button, IconButton, Panel, SectionTitle, Notice, Stack, Row, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Format = "jpeg" | "png" | "webp";

interface Source {
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
}

const MAX_SIDE = 8192;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default function ImageConverter() {
  const u = useUi();
  const [source, setSource] = useState<Source | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lock, setLock] = useState(true);
  const [format, setFormat] = useState<Format>("jpeg");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);

  const load = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Il file selezionato non è un'immagine.");
      return;
    }
    setError(null);
    setOutputSize(null);
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      setSource({ url, name: file.name.replace(/\.[^.]+$/, "") || "immagine", width: probe.naturalWidth, height: probe.naturalHeight, size: file.size });
      setWidth(String(probe.naturalWidth));
      setHeight(String(probe.naturalHeight));
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Impossibile leggere l'immagine.");
    };
    probe.src = url;
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => load(e.target.files?.[0]);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    load(e.dataTransfer.files?.[0]);
  };

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

  const clear = () => {
    setSource(null);
    setWidth("");
    setHeight("");
    setOutputSize(null);
    setError(null);
    if (input.current) input.current.value = "";
  };

  const save = () => {
    if (!source || !image.current) return;
    const w = Math.round(parseFloat(width));
    const h = Math.round(parseFloat(height));
    if (!(w > 0 && h > 0) || w > MAX_SIDE || h > MAX_SIDE) {
      setError(`Dimensioni non valide: usa valori tra 1 e ${MAX_SIDE} px.`);
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
    ctx.drawImage(image.current, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) {
          setError("Questo browser non supporta il formato scelto.");
          return;
        }
        setOutputSize(blob.size);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${source.name}_convertito.${format === "jpeg" ? "jpg" : format}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      `image/${format}`,
      format === "png" ? undefined : quality / 100,
    );
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SectionTitle right={source && <IconButton onClick={clear} title="Rimuovi immagine"><Trash2 className="w-4 h-4" /></IconButton>}>Immagine</SectionTitle>
          {!source ? (
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cx("w-full h-56 flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-colors", u.divider, u.muted, dragging && u.accent, u.id === "sophisticated" && "rounded-2xl")}
            >
              <ImagePlus className="w-7 h-7" />
              <span className={cx("text-xs font-semibold", u.text)}>Seleziona o trascina un'immagine</span>
              <span className="text-[11px]">PNG, JPG, WEBP, GIF</span>
            </button>
          ) : (
            <Panel className="space-y-3">
              <div className="h-44 flex items-center justify-center">
                <img ref={image} src={source.url} alt="Anteprima dell'immagine caricata" className="max-h-44 max-w-full object-contain" />
              </div>
              <div className={cx("pt-3 border-t space-y-1.5", u.divider)}>
                <Row label="Risoluzione" value={`${source.width} × ${source.height} px`} />
                <Row label="Peso" value={formatSize(source.size)} />
              </div>
            </Panel>
          )}
          <input ref={input} type="file" accept="image/*" onChange={onFile} className="hidden" />
        </div>

        <div className="space-y-4">
          <SectionTitle>Opzioni</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Larghezza (px)"><TextInput type="number" min="1" max={MAX_SIDE} disabled={!source} value={width} onChange={(e) => onWidth(e.target.value)} /></Field>
            <Field label="Altezza (px)"><TextInput type="number" min="1" max={MAX_SIDE} disabled={!source} value={height} onChange={(e) => onHeight(e.target.value)} /></Field>
          </div>
          <Toggle checked={lock} onChange={setLock} label="Mantieni proporzioni" />
          <Field label="Formato">
            <Chips value={format} onChange={setFormat} options={[{ value: "jpeg", label: "JPG" }, { value: "png", label: "PNG" }, { value: "webp", label: "WEBP" }]} />
          </Field>
          {format !== "png" && <Slider label="Qualità" value={quality} min={10} max={100} onChange={setQuality} display={`${quality}%`} />}
          <Button variant="primary" className="w-full" disabled={!source || busy} icon={<Download className="w-3.5 h-3.5" />} onClick={save}>
            {busy ? "Elaborazione..." : "Converti e scarica"}
          </Button>
          {outputSize !== null && <p className={cx("text-xs", u.muted)}>File generato: {formatSize(outputSize)}</p>}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>La conversione avviene interamente nel browser: nessun file viene inviato a server esterni.</Notice>
    </Stack>
  );
}
