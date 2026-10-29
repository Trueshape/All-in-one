import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Download, Eraser, ImagePlus, Paintbrush, Pipette, RotateCcw } from "lucide-react";
import { Field, Segmented, Slider, Toggle, Button, Panel, Notice, SectionTitle, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { averageCorners, computeAlpha } from "../lib/chromaKey";
import type { Rgb } from "../lib/chromaKey";

type Tool = "pick" | "erase" | "restore";

const MAX_SIDE = 3000;
const CHECKERBOARD = "repeating-conic-gradient(#8a8a8a 0% 25%, #5c5c5c 0% 50%) 50% / 16px 16px";

export default function BackgroundRemover() {
  const u = useUi();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const source = useRef<ImageData | null>(null);
  const output = useRef<ImageData | null>(null);
  const auto = useRef<Uint8ClampedArray | null>(null);
  const manual = useRef<Uint8Array | null>(null); // 0 = automatic, 1 = erased, 2 = restored
  const stroke = useRef<{ x: number; y: number } | null>(null);

  const [loaded, setLoaded] = useState<{ name: string; width: number; height: number; url: string; scaled: boolean } | null>(null);
  const [key, setKey] = useState<Rgb | null>(null);
  const [tolerance, setTolerance] = useState(30);
  const [feather, setFeather] = useState(2);
  const [contiguous, setContiguous] = useState(true);
  const [tool, setTool] = useState<Tool>("pick");
  const [brush, setBrush] = useState(24);
  const [bgMode, setBgMode] = useState<"transparent" | "color">("transparent");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showOriginal, setShowOriginal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (loaded) URL.revokeObjectURL(loaded.url); }, [loaded]);

  /** Writes alpha for the rectangle (or the whole image) into the output buffer and paints it. */
  const render = useCallback((rect?: { x0: number; y0: number; x1: number; y1: number }) => {
    const canvas = canvasRef.current;
    const src = source.current;
    const out = output.current;
    const autoAlpha = auto.current;
    const edits = manual.current;
    if (!canvas || !src || !out || !autoAlpha || !edits) return;
    const { width, height } = src;
    const { x0, y0, x1, y1 } = rect ?? { x0: 0, y0: 0, x1: width - 1, y1: height - 1 };
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const p = y * width + x;
        const i = p * 4;
        out.data[i] = src.data[i];
        out.data[i + 1] = src.data[i + 1];
        out.data[i + 2] = src.data[i + 2];
        out.data[i + 3] = edits[p] === 1 ? 0 : edits[p] === 2 ? src.data[i + 3] : autoAlpha[p];
      }
    }
    canvas.getContext("2d")?.putImageData(out, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }, []);

  // Recompute the automatic mask when the settings change.
  useEffect(() => {
    if (!loaded || !key || !source.current) return;
    const id = window.setTimeout(() => {
      auto.current = computeAlpha(source.current!, { key, tolerance, feather, contiguous });
      render();
    }, 60);
    return () => window.clearTimeout(id);
  }, [loaded, key, tolerance, feather, contiguous, render]);

  const load = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Il file selezionato non è un'immagine.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ratio = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.max(1, Math.round(img.naturalWidth * ratio));
      const height = Math.max(1, Math.round(img.naturalHeight * ratio));
      const work = document.createElement("canvas");
      work.width = width;
      work.height = height;
      const ctx = work.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);
      source.current = data;
      output.current = new ImageData(width, height);
      manual.current = new Uint8Array(width * height);
      auto.current = new Uint8ClampedArray(width * height).fill(255);
      canvas.width = width;
      canvas.height = height;
      setShowOriginal(false);
      setTool("pick");
      setLoaded({ name: file.name.replace(/\.[^.]+$/, "") || "immagine", width, height, url, scaled: ratio < 1 });
      setKey(averageCorners(data));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Impossibile leggere l'immagine.");
    };
    img.src = url;
  };

  const toPixel = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.min(canvas.width - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width))),
      y: Math.min(canvas.height - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height))),
      scale: canvas.width / rect.width,
    };
  };

  const stamp = (cx: number, cy: number, radius: number, value: 1 | 2) => {
    const src = source.current;
    const edits = manual.current;
    if (!src || !edits) return;
    const { width, height } = src;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const x1 = Math.min(width - 1, Math.ceil(cx + radius));
    const y1 = Math.min(height - 1, Math.ceil(cy + radius));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) edits[y * width + x] = value;
      }
    }
    render({ x0, y0, x1, y1 });
  };

  const paintTo = (x: number, y: number, scale: number) => {
    const value = tool === "erase" ? 1 : 2;
    const radius = (brush / 2) * scale;
    const from = stroke.current ?? { x, y };
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / Math.max(1, radius / 2)));
    for (let s = 1; s <= steps; s++) stamp(from.x + ((x - from.x) * s) / steps, from.y + ((y - from.y) * s) / steps, radius, value);
    stroke.current = { x, y };
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const { x, y, scale } = toPixel(e);
    if (tool === "pick") {
      const d = source.current?.data;
      if (d) setKey([d[(y * e.currentTarget.width + x) * 4], d[(y * e.currentTarget.width + x) * 4 + 1], d[(y * e.currentTarget.width + x) * 4 + 2]]);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = null;
    paintTo(x, y, scale);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!stroke.current) return;
    const { x, y, scale } = toPixel(e);
    paintTo(x, y, scale);
  };

  const endStroke = () => { stroke.current = null; };

  const clearEdits = () => {
    manual.current?.fill(0);
    render();
  };

  const change = () => {
    setLoaded(null);
    setKey(null);
    source.current = output.current = auto.current = manual.current = null;
    if (fileInput.current) fileInput.current.value = "";
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    if (bgMode === "color") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, out.width, out.height);
    }
    ctx.drawImage(canvas, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${loaded.name}-senza-sfondo.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const swatch = key ? `rgb(${key[0]}, ${key[1]}, ${key[2]})` : "transparent";

  return (
    <Stack>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0])} />

      {!loaded && (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); load(e.dataTransfer.files?.[0]); }}
          className={cx("w-full py-14 flex flex-col items-center gap-2 border-2 border-dashed cursor-pointer transition-colors", u.divider, u.muted, dragging && u.accent, u.id === "sophisticated" && "rounded-2xl")}
        >
          <ImagePlus className="w-7 h-7" />
          <span className={cx("text-xs font-semibold", u.text)}>Seleziona o trascina un'immagine</span>
          <span className="text-[11px]">Funziona meglio con sfondi uniformi (PNG, JPG, WEBP)</span>
        </button>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className={cx("grid grid-cols-1 lg:grid-cols-3 gap-6", !loaded && "hidden")}>
        <Panel className="space-y-5 lg:col-span-1">
          <SectionTitle right={<Button size="sm" variant="ghost" onClick={change}>Cambia immagine</Button>}>Regolazioni</SectionTitle>

          <Slider label="Tolleranza colore" value={tolerance} min={5} max={85} onChange={setTolerance} display={`${tolerance}%`} />
          <Slider label="Sfumatura bordo" value={feather} min={0} max={10} onChange={setFeather} display={feather} />
          <Toggle checked={contiguous} onChange={setContiguous} label="Rimuovi solo lo sfondo collegato ai bordi" />

          <Field label="Colore dello sfondo" hint="Scegli lo strumento Campiona e tocca l'immagine per cambiarlo.">
            <div className="flex items-center gap-2">
              <span className={cx("w-8 h-8 border", u.divider)} style={{ background: swatch }} />
              <span className={cx("text-xs font-mono", u.subtle)}>{key ? swatch : "—"}</span>
            </div>
          </Field>

          <Field label="Strumento">
            <Segmented
              value={tool}
              onChange={setTool}
              options={[
                { value: "pick", label: <span className="inline-flex items-center gap-1"><Pipette className="w-3.5 h-3.5" /> Campiona</span> },
                { value: "erase", label: <span className="inline-flex items-center gap-1"><Eraser className="w-3.5 h-3.5" /> Cancella</span> },
                { value: "restore", label: <span className="inline-flex items-center gap-1"><Paintbrush className="w-3.5 h-3.5" /> Ripristina</span> },
              ]}
            />
          </Field>
          {tool !== "pick" && <Slider label="Dimensione pennello" value={brush} min={6} max={120} onChange={setBrush} display={`${brush}px`} />}
          <Button size="sm" className="w-full" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={clearEdits}>Annulla ritocchi manuali</Button>

          <Field label="Sfondo dell'esportazione">
            <div className="flex items-center gap-3">
              <Segmented value={bgMode} onChange={setBgMode} options={[{ value: "transparent", label: "Trasparente" }, { value: "color", label: "Colore" }]} />
              {bgMode === "color" && <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" aria-label="Colore di sfondo" />}
            </div>
          </Field>

          <Button variant="primary" className="w-full" icon={<Download className="w-3.5 h-3.5" />} onClick={download}>Scarica PNG</Button>
        </Panel>

        <div className="lg:col-span-2 space-y-3">
          <SectionTitle right={<Button size="sm" onClick={() => setShowOriginal((s) => !s)}>{showOriginal ? "Mostra risultato" : "Mostra originale"}</Button>}>Anteprima</SectionTitle>
          <div className={cx("flex items-center justify-center p-2 border min-h-[280px]", u.divider)} style={{ background: bgMode === "color" ? bgColor : CHECKERBOARD }}>
            <canvas
              ref={canvasRef}
              className={cx("max-w-full max-h-[460px]", showOriginal && "hidden", tool === "pick" ? "cursor-crosshair" : "cursor-cell")}
              style={{ touchAction: tool === "pick" ? "auto" : "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
            />
            {loaded && showOriginal && <img src={loaded.url} alt="Immagine originale" className="max-w-full max-h-[460px]" />}
          </div>
          {loaded?.scaled && <p className={cx("text-[11px]", u.muted)}>L'immagine è stata ridotta a {loaded.width} × {loaded.height} px per mantenere fluida l'elaborazione.</p>}
          <p className={cx("text-[11px]", u.muted)}>La rimozione si basa sul colore, non su un modello di intelligenza artificiale, e avviene nel browser. Nessun file viene inviato altrove.</p>
        </div>
      </div>
    </Stack>
  );
}
