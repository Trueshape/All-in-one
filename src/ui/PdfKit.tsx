import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { FileText, Trash2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PDFDocument } from "pdf-lib";
import { Button, Row, cx } from "./kit";
import { useUi } from "./tokens";
import { download, formatBytes } from "../lib/imageOps";

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

/** The PDF as pdf-lib sees it, to change and save. Throws with a readable message. */
export async function editPdf(bytes: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes);
  } catch (e) {
    throw new Error(pdfError(e));
  }
}

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

export function PdfDrop({ onFiles, multiple = false, accept = "application/pdf,.pdf", label, hint = "PDF", className = "h-56" }: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
  hint?: string;
  className?: string;
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
        <FileText className="w-7 h-7" />
        <span className={cx("text-xs font-semibold", u.text)}>{label ?? (multiple ? "Seleziona o trascina uno o più PDF" : "Seleziona o trascina un PDF")}</span>
        <span className="text-[11px]">{hint}</span>
      </button>
      <input ref={input} type="file" accept={accept} multiple={multiple} onChange={onChange} className="hidden" />
    </>
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
        const ratio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: (width / base.width) * ratio, rotation: turn });
        el.width = Math.round(viewport.width);
        el.height = Math.round(viewport.height);
        setHeight(Math.round(viewport.height / ratio));
        task = page.render({ canvas: el, viewport });
        await task.promise;
      } catch {
        // cancelled because the page changed or the tool closed
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, index, width, rotation]);

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
