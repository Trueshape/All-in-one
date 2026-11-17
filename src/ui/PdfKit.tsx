import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight, FileText, Trash2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Button, IconButton, Notice, Row, Stack, cx } from "./kit";
import { useUi } from "./tokens";
import { download, formatBytes, toBlob } from "../lib/imageOps";
import { hexToRgb } from "../lib/color";
import { clampView, zoomAt } from "../lib/pdfPages";
import type { View } from "../lib/pdfPages";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
export { pdfjs };
export type { PDFDocumentProxy };

/** pdf.js hands the buffer to its worker and empties it, so it always gets a copy. */
export const openPdf = (bytes: Uint8Array) => pdfjs.getDocument({ data: bytes.slice() }).promise;

export const isPdf = (file: File) => file.type === "application/pdf" || /\.pdf$/i.test(file.name);
export const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "documento";

/** Messages for the ways a PDF can fail to open or to be changed. */
export function pdfError(e: unknown): string {
  const name = (e as { name?: string; constructor?: { name?: string } })?.name ?? (e as { constructor?: { name?: string } })?.constructor?.name;
  if (name === "PasswordException") return "Il PDF è protetto da password: aprilo, salvalo senza password e riprova.";
  if (name === "EncryptedPDFError" || /encrypt/i.test(String((e as Error)?.message))) return "Il PDF è cifrato (ha limiti di modifica): nel browser non si può cambiare.";
  return "Impossibile leggere il PDF: il file è danneggiato o non è un PDF valido.";
}

/** The PDF as pdf-lib sees it, to change and save. Throws with a readable message. `keepMetadata` stops pdf-lib from writing its own name and today's date in the properties. */
export async function editPdf(bytes: Uint8Array, keepMetadata = false): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: !keepMetadata });
  } catch (e) {
    throw new Error(pdfError(e));
  }
}

/** pdf-lib's standard fonts only know the Latin letters of WinAnsi: anything else gets this message instead of a crash. */
export function drawError(e: unknown): string {
  const m = /cannot encode "(.+?)"/i.exec(String((e as Error)?.message));
  return m ? `Il font standard non ha il carattere "${m[1]}": usa lettere latine, numeri e punteggiatura comune.` : (e as Error)?.message || "Salvataggio non riuscito.";
}

/** Point on the page as shown (fractions of width and height from the top-left corner) → PDF coordinates, rotation and crop included. */
export async function pdfPoint(doc: PDFDocumentProxy, index: number) {
  const page = await doc.getPage(index + 1);
  const viewport = page.getViewport({ scale: 1 });
  return {
    rotate: page.rotate,
    width: viewport.width,
    height: viewport.height,
    at: (fx: number, fy: number) => viewport.convertToPdfPoint(fx * viewport.width, fy * viewport.height) as [number, number],
  };
}

/** Fraction of `el` under the pointer, clamped to 0..1. */
export function fractionAt(e: { clientX: number; clientY: number }, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { fx: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), fy: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
}

/** Drags something placed on a page: `onMove` gets the new top-left corner as fractions of the stage. */
export function startDrag(e: React.PointerEvent, stage: HTMLElement | null, from: { fx: number; fy: number }, onMove: (fx: number, fy: number) => void) {
  if (!stage) return;
  e.preventDefault();
  e.stopPropagation();
  const r = stage.getBoundingClientRect();
  const x0 = e.clientX;
  const y0 = e.clientY;
  const move = (ev: PointerEvent) =>
    onMove(Math.min(1, Math.max(0, from.fx + (ev.clientX - x0) / r.width)), Math.min(1, Math.max(0, from.fy + (ev.clientY - y0) / r.height)));
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/** Largest side, in px, a page may be drawn with when zoomed in. */
const MAX_CANVAS = 4096;
/** How many times sharper than the screen the pages inside a ZoomPan are drawn (it follows the zoom, once it settles). */
const ZoomQuality = createContext(1);

/**
 * A frame that zooms with the mouse wheel around the cursor and moves with the left button held down; a double click goes back to the whole page.
 * Things inside keep working: a click that was really a move is not delivered, and items that handle their own drag are left alone.
 */
export function ZoomPan({ children, resetKey }: { children: ReactNode; resetKey?: unknown }) {
  const u = useUi();
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [quality, setQuality] = useState(1);
  const [panning, setPanning] = useState(false);
  const live = useRef(view);
  live.current = view;
  const moved = useRef(false);

  useEffect(() => setView({ scale: 1, x: 0, y: 0 }), [resetKey]);

  // Sharper pixels once the zoom has stopped changing
  useEffect(() => {
    const timer = setTimeout(() => setQuality(Math.max(1, Math.ceil(view.scale))), 250);
    return () => clearTimeout(timer);
  }, [view.scale]);

  // React registers wheel listeners as passive, which cannot stop the modal from scrolling: this one is added by hand.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      // the frame itself is never scaled: its size is the page's size at zoom 1
      setView((v) => zoomAt(v, Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top, el.offsetWidth, el.offsetHeight));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  const down = (e: React.PointerEvent) => {
    const el = frame.current;
    if (!el || e.button !== 0 || live.current.scale <= 1) return;
    if ((e.target as HTMLElement).closest("input, textarea, button, select")) return;
    const start = { x: e.clientX, y: e.clientY, view: live.current };
    moved.current = false;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!moved.current && Math.hypot(dx, dy) < 4) return;
      moved.current = true;
      setPanning(true);
      setView(clampView({ ...start.view, x: start.view.x + dx, y: start.view.y + dy }, el.offsetWidth, el.offsetHeight));
    };
    const up = () => {
      setPanning(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div
        ref={frame}
        className="relative overflow-hidden shadow max-w-full"
        style={{ cursor: panning ? "grabbing" : view.scale > 1 ? "grab" : undefined, touchAction: view.scale > 1 ? "none" : undefined }}
        onPointerDown={down}
        onClickCapture={(e) => {
          // the mouse button went up after a drag: that was a move, not a click on the page
          if (moved.current) {
            e.stopPropagation();
            moved.current = false;
          }
        }}
        onDoubleClick={() => setView({ scale: 1, x: 0, y: 0 })}
      >
        <div style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0" }}>
          <ZoomQuality.Provider value={quality}>{children}</ZoomQuality.Provider>
        </div>
        {view.scale > 1 && (
          <button
            type="button"
            onClick={() => setView({ scale: 1, x: 0, y: 0 })}
            title="Torna alla pagina intera"
            className={cx("absolute top-1.5 right-1.5 px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer", u.btnSecondary)}
          >
            {Math.round(view.scale * 100)}% ✕
          </button>
        )}
      </div>
      <span className={cx("text-[11px]", u.muted)}>Rotella: zoom · tieni premuto e trascina: sposta · doppio clic: pagina intera</span>
    </div>
  );
}

/** A page with page arrows above it and a layer for things placed on it. A click on the page itself calls `onPick` with the point as fractions. */
export function PageStage({ pdf, page, onPage, width, onPick, stageRef, children }: {
  pdf: PdfFile;
  page: number;
  onPage: (page: number) => void;
  width: number;
  onPick?: (fx: number, fy: number) => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  children?: ReactNode;
}) {
  const u = useUi();
  return (
    <div className="flex flex-col items-center gap-3 min-w-0">
      <div className="flex items-center gap-3">
        <IconButton disabled={page === 0} onClick={() => onPage(page - 1)} title="Pagina precedente"><ChevronLeft /></IconButton>
        <span className={cx("text-xs font-mono", u.muted)}>Pagina {page + 1} di {pdf.pages}</span>
        <IconButton disabled={page === pdf.pages - 1} onClick={() => onPage(page + 1)} title="Pagina successiva"><ChevronRight /></IconButton>
      </div>
      <ZoomPan resetKey={page}>
        <div
          ref={stageRef}
          className={cx("relative overflow-hidden select-none", onPick && "cursor-crosshair")}
          onClick={(e) => {
            if (onPick && (e.target === e.currentTarget || (e.target as HTMLElement).tagName === "CANVAS")) {
              const { fx, fy } = fractionAt(e, e.currentTarget);
              onPick(fx, fy);
            }
          }}
        >
          <PageThumb doc={pdf.doc} index={page} width={width} />
          {children}
        </div>
      </ZoomPan>
    </div>
  );
}

/** Shows page `page` of PDF bytes made on the fly (the result of a tool), so the preview is the real output. */
export function ResultPreview({ bytes, page, width }: { bytes: Uint8Array | null; page: number; width: number }) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  useEffect(() => {
    if (!bytes) return;
    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;
    void openPdf(bytes).then((d) => {
      opened = d;
      if (cancelled) void d.destroy();
      else setDoc(d);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      // the previous preview stays on screen until the new one is ready, then it is freed
      setTimeout(() => void opened?.destroy(), 2000);
    };
  }, [bytes]);
  if (!doc) return <div className="bg-white/5" style={{ width, height: Math.round(width * 1.414) }} />;
  return <PageThumb doc={doc} index={Math.min(page, doc.numPages - 1)} width={width} className="shadow" />;
}

/** The three standard PDF fonts (no file to embed), with the CSS fonts that look closest on screen. */
export const FONTS = {
  helvetica: { label: "Helvetica", regular: StandardFonts.Helvetica, bold: StandardFonts.HelveticaBold, css: "Helvetica, Arial, sans-serif" },
  times: { label: "Times", regular: StandardFonts.TimesRoman, bold: StandardFonts.TimesRomanBold, css: "'Times New Roman', Times, serif" },
  courier: { label: "Courier", regular: StandardFonts.Courier, bold: StandardFonts.CourierBold, css: "'Courier New', Courier, monospace" },
} as const;
export type FontKey = keyof typeof FONTS;
export const FONT_OPTIONS = (Object.keys(FONTS) as FontKey[]).map((k) => ({ value: k, label: FONTS[k].label }));

/** "#rrggbb" → pdf-lib colour. */
export function pdfColor(hex: string) {
  const c = hexToRgb(hex) ?? [0, 0, 0];
  return rgb(c[0] / 255, c[1] / 255, c[2] / 255);
}

export interface PickedImage {
  url: string;
  bytes: Uint8Array;
  kind: "png" | "jpg";
  width: number;
  height: number;
  name: string;
}

/** Reads an image for a PDF: PNG and JPEG go in as they are, other formats are redrawn as PNG. */
export async function readImage(file: File): Promise<PickedImage> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Impossibile leggere l'immagine (formato non supportato da questo browser).");
  }
  const base = { url, width: img.naturalWidth, height: img.naturalHeight, name: baseName(file.name) };
  if (file.type === "image/png" || file.type === "image/jpeg") return { ...base, bytes: new Uint8Array(await file.arrayBuffer()), kind: file.type === "image/png" ? "png" : "jpg" };
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")?.drawImage(img, 0, 0);
  const blob = await toBlob(canvas, "image/png");
  if (!blob) throw new Error("Impossibile convertire l'immagine.");
  return { ...base, bytes: new Uint8Array(await blob.arrayBuffer()), kind: "png" };
}

export const embedImage = (doc: PDFDocument, image: PickedImage) => (image.kind === "png" ? doc.embedPng(image.bytes) : doc.embedJpg(image.bytes));

export const savePdf = (bytes: Uint8Array, name: string) => download(new Blob([bytes as BlobPart], { type: "application/pdf" }), name);

export interface PdfFile {
  name: string;
  size: number;
  bytes: Uint8Array;
  doc: PDFDocumentProxy;
  pages: number;
}

/** Loads one PDF for preview (pdf.js) and keeps its bytes for pdf-lib. */
export function usePdf() {
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => void pdf?.doc.destroy(), [pdf]);

  const load = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!isPdf(file)) {
      setError("Il file selezionato non è un PDF.");
      return;
    }
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await openPdf(bytes);
      setPdf({ name: baseName(file.name), size: file.size, bytes, doc, pages: doc.numPages });
    } catch (e) {
      setError(pdfError(e));
    }
    setBusy(false);
  };

  const clear = () => {
    setPdf(null);
    setError(null);
  };

  return { pdf, error, setError, busy, load, clear };
}

export function PdfDrop({ onFiles, multiple = false, accept = "application/pdf,.pdf", label, hint = "PDF", className = "h-56", icon }: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  hint?: string;
  className?: string;
  /** The icon above the text; the PDF sheet by default. */
  icon?: ReactNode;
}) {
  const u = useUi();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = [...(e.dataTransfer.files ?? [])];
    onFiles(multiple ? files : files.slice(0, 1));
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFiles([...(e.target.files ?? [])]);
    e.target.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx("w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-colors", className, u.divider, u.muted, dragging && u.accent, u.id === "sophisticated" && "rounded-2xl")}
      >
        {icon ?? <FileText className="w-7 h-7" />}
        <span className={cx("text-xs font-semibold whitespace-pre-line text-center", u.text)}>{label ?? (multiple ? "Seleziona o trascina uno o più PDF" : "Seleziona o trascina un PDF")}</span>
        <span className="text-[11px]">{hint}</span>
      </button>
      <input ref={input} type="file" accept={accept} multiple={multiple} onChange={onChange} className="hidden" />
    </>
  );
}

/** Runs a save action, keeping its error for the page and a busy flag for the buttons. */
export function useSaver() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(drawError(e));
    }
    setBusy(false);
  };
  return { busy, error, setError, run };
}

/** The drop area until a PDF is loaded, then the tool, with the tool's explanation under it. */
export function SinglePdf({ state, info, children }: { state: ReturnType<typeof usePdf>; info: ReactNode; children: (pdf: PdfFile) => ReactNode }) {
  return (
    <Stack>
      {state.pdf ? children(state.pdf) : <PdfDrop onFiles={(files) => void state.load(files[0])} hint={state.busy ? "Lettura del PDF…" : "PDF"} />}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Notice>{info}</Notice>
    </Stack>
  );
}

/** Name, pages and size of the loaded PDF, with the button that removes it. */
export function PdfFileBar({ pdf, onClear, children }: { pdf: PdfFile; onClear: () => void; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <Row label="File" value={`${pdf.name}.pdf`} />
        <Row label="Pagine" value={`${pdf.pages} · ${formatBytes(pdf.size)}`} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button size="sm" variant="danger" icon={<Trash2 />} onClick={onClear}>Rimuovi</Button>
      </div>
    </div>
  );
}

/** Renders one page (0-based `index`) `width` px wide, turned by `rotation` degrees on top of the page's own rotation. */
export function PageThumb({ doc, index, width, rotation = 0, className }: { doc: PDFDocumentProxy; index: number; width: number; rotation?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const quality = useContext(ZoomQuality);
  const [height, setHeight] = useState(Math.round(width * 1.414));

  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | null = null;
    void (async () => {
      try {
        const page = await doc.getPage(index + 1);
        const el = canvas.current;
        if (cancelled || !el) return;
        const turn = (((page.rotate + rotation) % 360) + 360) % 360;
        const base = page.getViewport({ scale: 1, rotation: turn });
        // zoomed in, the page is drawn with more pixels (up to a safe size) so it stays sharp
        const ratio = Math.min((window.devicePixelRatio || 1) * quality, MAX_CANVAS / width);
        const viewport = page.getViewport({ scale: (width / base.width) * ratio, rotation: turn });
        setHeight(Math.round((width * base.height) / base.width));
        const off = document.createElement("canvas");
        off.width = Math.round(viewport.width);
        off.height = Math.round(viewport.height);
        task = page.render({ canvas: off, viewport });
        await task.promise;
        if (cancelled) return;
        el.width = off.width;
        el.height = off.height;
        el.getContext("2d")?.drawImage(off, 0, 0);
      } catch {
        // cancelled because the page changed or the tool closed
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, index, width, rotation, quality]);

  return <canvas ref={canvas} className={cx("block bg-white", className)} style={{ width, height }} aria-label={`Pagina ${index + 1}`} />;
}

/** Size of a page as it is shown (rotation included), in points. */
export function usePageSize(doc: PDFDocumentProxy | undefined, index: number) {
  const [size, setSize] = useState<{ width: number; height: number; rotate: number } | null>(null);
  useEffect(() => {
    setSize(null);
    if (!doc) return;
    let cancelled = false;
    void doc.getPage(index + 1).then((page) => {
      const v = page.getViewport({ scale: 1 });
      if (!cancelled) setSize({ width: v.width, height: v.height, rotate: page.rotate });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, index]);
  return size;
}
