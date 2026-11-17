import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, RotateCcw, RotateCw, Trash2, X } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { Button, Field, IconButton, Notice, Row, Segmented, Stack, TextInput, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { useUnsaved } from "../ui/unsaved";
import { PageThumb, PdfDrop, PdfFileBar, SinglePdf, ZoomPan, baseName, editPdf, isPdf, pdfError, savePdf, usePageSize, usePdf, useSaver } from "../ui/PdfKit";
import type { PdfFile } from "../ui/PdfKit";
import { formatBytes } from "../lib/imageOps";
import { chunkPages, groupLabel, marginsForRotation, mmToPt, moveItem, parsePageList, parseRangeGroups, ptToMm } from "../lib/pdfPages";

const THUMB = 132;
/** Long PDFs scroll inside this box, so the window keeps its size. */
const GRID = "grid gap-3 max-h-[620px] overflow-auto p-1";
const GRID_COLUMNS = { gridTemplateColumns: `repeat(auto-fill, minmax(${THUMB + 16}px, 1fr))` };

/** Copies `indices` of `source` into a new PDF, in that order. */
async function pickPages(source: PDFDocument, indices: number[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const page of await out.copyPages(source, indices)) out.addPage(page);
  return out.save();
}

/** One page in a grid: thumbnail, number, and the page's own buttons. */
function PageCard({ pdf, index, label, rotation, marked, onClick, children, dragProps }: {
  pdf: PdfFile;
  index: number;
  label?: ReactNode;
  rotation?: number;
  marked?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  dragProps?: React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };
}) {
  const u = useUi();
  return (
    <div {...dragProps} className={cx("flex flex-col items-center gap-2 p-2 rounded-lg border", u.divider, dragProps?.draggable && "cursor-grab")}>
      <button type="button" onClick={onClick} disabled={!onClick} className={cx("relative", onClick && "cursor-pointer")} title={onClick ? "Clicca per selezionare" : undefined}>
        <PageThumb doc={pdf.doc} index={index} width={THUMB} rotation={rotation} className={cx("shadow transition-opacity", marked && "opacity-30")} />
        {marked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <X className="w-12 h-12 text-red-500" strokeWidth={3} />
          </span>
        )}
      </button>
      <div className={cx("text-[11px] font-mono", u.muted)}>{label ?? `Pagina ${index + 1}`}</div>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  );
}

/* ---------------- Unisci ---------------- */

interface MergeItem {
  id: number;
  name: string;
  size: number;
  pages: number;
  bytes: Uint8Array;
}

export function PdfMerge() {
  const u = useUi();
  const [items, setItems] = useState<MergeItem[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const saver = useSaver();
  useUnsaved(items.length > 0);

  const add = async (files: File[]) => {
    setProblem(null);
    const added: MergeItem[] = [];
    const skipped: string[] = [];
    for (const file of files) {
      if (!isPdf(file)) {
        skipped.push(`${file.name} non è un PDF`);
        continue;
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes);
        added.push({ id: Date.now() + Math.random(), name: baseName(file.name), size: file.size, pages: doc.getPageCount(), bytes });
      } catch (e) {
        skipped.push(`${file.name}: ${pdfError(e)}`);
      }
    }
    setItems((prev) => [...prev, ...added]);
    if (skipped.length) setProblem(skipped.join(" · "));
  };

  const total = items.reduce((n, item) => n + item.pages, 0);
  const merge = () =>
    saver.run(async () => {
      const out = await PDFDocument.create();
      for (const item of items) {
        const src = await PDFDocument.load(item.bytes);
        for (const page of await out.copyPages(src, src.getPageIndices())) out.addPage(page);
      }
      savePdf(await out.save(), `${items[0].name}_unito.pdf`);
    });

  return (
    <Stack>
      <PdfDrop multiple onFiles={(files) => void add(files)} hint="Aggiungi i PDF nell'ordine che preferisci: poi puoi spostarli" />
      {items.length > 0 && (
        <div className={cx("max-h-[420px] overflow-auto border divide-y", u.divider)}>
          {items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2 text-xs">
              <span className={cx("w-6 font-mono", u.muted)}>{i + 1}</span>
              <span className={cx("flex-1 min-w-0 truncate", u.text)}>{item.name}.pdf</span>
              <span className={cx("font-mono", u.muted)}>{item.pages} pag. · {formatBytes(item.size)}</span>
              <IconButton disabled={i === 0} onClick={() => setItems(moveItem(items, i, i - 1))} title="Sposta su"><ArrowUp /></IconButton>
              <IconButton disabled={i === items.length - 1} onClick={() => setItems(moveItem(items, i, i + 1))} title="Sposta giù"><ArrowDown /></IconButton>
              <IconButton onClick={() => setItems(items.filter((x) => x.id !== item.id))} title="Togli dall'elenco"><Trash2 /></IconButton>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" disabled={items.length < 2 || saver.busy} onClick={() => void merge()}>Salva</Button>
          <span className={cx("text-xs", u.muted)}>{items.length < 2 ? "Servono almeno due PDF." : `${items.length} file, ${total} pagine in tutto`}</span>
          <Button size="sm" variant="danger" icon={<Trash2 />} className="ml-auto" onClick={() => setItems([])}>Svuota</Button>
        </div>
      )}
      {(problem || saver.error) && <Notice tone="error">{problem ?? saver.error}</Notice>}
      <Notice>I PDF si uniscono nell'ordine dell'elenco, con tutte le loro pagine. Tutto avviene nel browser: i file non vengono inviati.</Notice>
    </Stack>
  );
}

/* ---------------- Separa ---------------- */

type SplitMode = "each" | "every" | "ranges";

export function PdfSplit() {
  const u = useUi();
  const state = usePdf();
  const [mode, setMode] = useState<SplitMode>("each");
  const [every, setEvery] = useState("2");
  const [ranges, setRanges] = useState("1-2, 3");
  const saver = useSaver();
  const count = state.pdf?.pages ?? 0;

  const groups: number[][] | string = useMemo(() => {
    if (!count) return [];
    if (mode === "each") return chunkPages(count, 1);
    if (mode === "every") {
      const n = Number(every);
      return Number.isInteger(n) && n > 0 ? chunkPages(count, n) : "Scrivi un numero intero di pagine.";
    }
    return parseRangeGroups(ranges, count);
  }, [count, mode, every, ranges]);

  /** `parts` are positions in `groups`: the file names keep the part numbers shown in the list. */
  const save = (pdf: PdfFile, all: number[][], parts: number[]) =>
    saver.run(async () => {
      const src = await editPdf(pdf.bytes);
      for (const part of parts) {
        savePdf(await pickPages(src, all[part]), `${pdf.name}_parte${part + 1}.pdf`);
        // browsers drop downloads started too close together
        if (parts.length > 1) await new Promise((r) => setTimeout(r, 300));
      }
    });

  return (
    <SinglePdf state={state} info="Ogni parte diventa un PDF separato. Se scarichi tutte le parti insieme, il browser può chiederti il permesso per più download.">
      {(pdf) => (
        <>
            <PdfFileBar pdf={pdf} onClear={state.clear} />
            <Segmented fill value={mode} onChange={setMode} options={[{ value: "each", label: "Ogni pagina" }, { value: "every", label: "Ogni N pagine" }, { value: "ranges", label: "Intervalli" }]} />
            {mode === "every" && (
              <Field label="Pagine per parte"><TextInput className="w-32" type="number" inputMode="numeric" min={1} value={every} onChange={(e) => setEvery(e.target.value)} /></Field>
            )}
            {mode === "ranges" && (
              <Field label="Intervalli" hint="Una parte per ogni gruppo separato da virgola: 1-3, 4, 5-9.">
                <TextInput value={ranges} onChange={(e) => setRanges(e.target.value)} />
              </Field>
            )}
            {typeof groups === "string" && <Notice tone="warn">{groups}</Notice>}
            {saver.error && <Notice tone="error">{saver.error}</Notice>}
            <div className="flex items-center justify-between gap-3">
              <span className={cx("text-xs", u.muted)}>{typeof groups === "string" ? "—" : `${groups.length} parti`}</span>
              <Button variant="primary" disabled={typeof groups === "string" || !groups.length || saver.busy} onClick={() => typeof groups !== "string" && void save(pdf, groups, groups.map((_, i) => i))}>
                {typeof groups === "string" ? "PDF" : `PDF (${groups.length})`}
              </Button>
            </div>
            <div className={cx("max-h-[420px] overflow-auto border divide-y", u.divider)}>
              {typeof groups !== "string" &&
                groups.map((group, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
                    <span className={cx("font-mono", u.muted)}>Parte {i + 1} · {groupLabel(group)}</span>
                    <Button size="sm" disabled={saver.busy} onClick={() => void save(pdf, groups, [i])}>Salva</Button>
                  </div>
                ))}
            </div>
        </>
      )}
    </SinglePdf>
  );
}

/* ---------------- Rimuovi pagine ---------------- */

export function PdfRemovePages() {
  const u = useUi();
  const state = usePdf();
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const saver = useSaver();

  const toggle = (i: number) => setRemoved((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });

  const save = (pdf: PdfFile) =>
    saver.run(async () => {
      const src = await editPdf(pdf.bytes);
      const keep = src.getPageIndices().filter((i) => !removed.has(i));
      savePdf(await pickPages(src, keep), `${pdf.name}_ridotto.pdf`);
    });

  return (
    <SinglePdf state={{ ...state, clear: () => { state.clear(); setRemoved(new Set()); } }} info="Clicca sulle pagine da togliere (diventano barrate) oppure scrivile nel campo. Il PDF originale non cambia: ne scarichi una copia.">
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={() => { state.clear(); setRemoved(new Set()); }} />
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Pagine da togliere" className="w-72">
              <TextInput value={typed} placeholder="es. 2, 5-7" onChange={(e) => setTyped(e.target.value)} />
            </Field>
            <Button
              disabled={!typed.trim()}
              onClick={() => {
                const list = parsePageList(typed, pdf.pages);
                if (typeof list === "string") return setTypedError(list);
                setTypedError(null);
                setRemoved(new Set([...removed, ...list]));
              }}
            >
              Segna
            </Button>
            <Button disabled={!removed.size} onClick={() => setRemoved(new Set())}>Nessuna</Button>
            <span className={cx("text-xs", u.muted)}>{removed.size} da togliere · restano {pdf.pages - removed.size}</span>
            <Button variant="primary" className="ml-auto" disabled={!removed.size || removed.size === pdf.pages || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
          </div>
          {typedError && <Notice tone="warn">{typedError}</Notice>}
          {removed.size === pdf.pages && <Notice tone="warn">Non puoi togliere tutte le pagine.</Notice>}
          {saver.error && <Notice tone="error">{saver.error}</Notice>}
          <div className={GRID} style={GRID_COLUMNS}>
            {Array.from({ length: pdf.pages }, (_, i) => (
              <PageCard key={i} pdf={pdf} index={i} marked={removed.has(i)} onClick={() => toggle(i)} />
            ))}
          </div>
        </>
      )}
    </SinglePdf>
  );
}

/* ---------------- Ruota ---------------- */

export function PdfRotate() {
  const u = useUi();
  const state = usePdf();
  const [turns, setTurns] = useState<Record<number, number>>({});
  const saver = useSaver();
  const turn = (i: number, by: number) => setTurns((prev) => ({ ...prev, [i]: (((prev[i] ?? 0) + by) % 360 + 360) % 360 }));
  const changed = Object.values(turns).filter(Boolean).length;

  const save = (pdf: PdfFile) =>
    saver.run(async () => {
      const doc = await editPdf(pdf.bytes);
      doc.getPages().forEach((page, i) => {
        if (turns[i]) page.setRotation(degrees((page.getRotation().angle + turns[i]) % 360));
      });
      savePdf(await doc.save(), `${pdf.name}_ruotato.pdf`);
    });

  const reset = () => setTurns({});
  return (
    <SinglePdf state={{ ...state, clear: () => { state.clear(); reset(); } }} info="Ruota ogni pagina con le sue frecce, o tutte insieme. La rotazione si somma a quella che la pagina ha già.">
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={() => { state.clear(); reset(); }} />
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={<RotateCcw />} onClick={() => Array.from({ length: pdf.pages }, (_, i) => turn(i, -90))}>Tutte a sinistra</Button>
            <Button icon={<RotateCw />} onClick={() => Array.from({ length: pdf.pages }, (_, i) => turn(i, 90))}>Tutte a destra</Button>
            <Button disabled={!changed} onClick={reset}>Ripristina</Button>
            <span className={cx("text-xs", u.muted)}>{changed === 1 ? "1 pagina ruotata" : `${changed} pagine ruotate`}</span>
            <Button variant="primary" className="ml-auto" disabled={!changed || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
          </div>
          {saver.error && <Notice tone="error">{saver.error}</Notice>}
          <div className={GRID} style={GRID_COLUMNS}>
            {Array.from({ length: pdf.pages }, (_, i) => (
              <PageCard key={i} pdf={pdf} index={i} rotation={turns[i] ?? 0} label={turns[i] ? `Pagina ${i + 1} · ${turns[i]}°` : undefined}>
                <IconButton onClick={() => turn(i, -90)} title="Ruota a sinistra"><RotateCcw /></IconButton>
                <IconButton onClick={() => turn(i, 90)} title="Ruota a destra"><RotateCw /></IconButton>
              </PageCard>
            ))}
          </div>
        </>
      )}
    </SinglePdf>
  );
}

/* ---------------- Riordina ---------------- */

export function PdfReorder() {
  const u = useUi();
  const state = usePdf();
  const [order, setOrder] = useState<number[] | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const saver = useSaver();

  const save = (pdf: PdfFile, list: number[]) =>
    saver.run(async () => {
      savePdf(await pickPages(await editPdf(pdf.bytes), list), `${pdf.name}_riordinato.pdf`);
    });

  return (
    <SinglePdf state={{ ...state, clear: () => { state.clear(); setOrder(null); } }} info="Trascina le pagine nella nuova posizione, oppure usa le frecce sotto ciascuna.">
      {(pdf) => {
        const list = order && order.length === pdf.pages ? order : Array.from({ length: pdf.pages }, (_, i) => i);
        const moved = list.some((p, i) => p !== i);
        return (
          <>
            <PdfFileBar pdf={pdf} onClear={() => { state.clear(); setOrder(null); }} />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setOrder([...list].reverse())}>Inverti ordine</Button>
              <Button disabled={!moved} onClick={() => setOrder(null)}>Ripristina</Button>
              <span className={cx("text-xs", u.muted)}>{moved ? "Ordine cambiato" : "Ordine originale"}</span>
              <Button variant="primary" className="ml-auto" disabled={!moved || saver.busy} onClick={() => void save(pdf, list)}>Salva</Button>
            </div>
            {saver.error && <Notice tone="error">{saver.error}</Notice>}
            <div className={GRID} style={GRID_COLUMNS}>
              {list.map((page, pos) => (
                <PageCard
                  key={page}
                  pdf={pdf}
                  index={page}
                  label={`${pos + 1} · era ${page + 1}`}
                  dragProps={{
                    draggable: true,
                    onDragStart: () => setDragFrom(pos),
                    onDragOver: (e) => e.preventDefault(),
                    onDrop: (e) => {
                      e.preventDefault();
                      if (dragFrom !== null && dragFrom !== pos) setOrder(moveItem(list, dragFrom, pos));
                      setDragFrom(null);
                    },
                  }}
                >
                  <IconButton disabled={pos === 0} onClick={() => setOrder(moveItem(list, pos, pos - 1))} title="Sposta prima"><ArrowLeft /></IconButton>
                  <IconButton disabled={pos === list.length - 1} onClick={() => setOrder(moveItem(list, pos, pos + 1))} title="Sposta dopo"><ArrowRight /></IconButton>
                </PageCard>
              ))}
            </div>
          </>
        );
      }}
    </SinglePdf>
  );
}

/* ---------------- Ritaglia ---------------- */

const SIDES = [
  { key: "top", label: "Sopra" },
  { key: "right", label: "Destra" },
  { key: "bottom", label: "Sotto" },
  { key: "left", label: "Sinistra" },
] as const;

export function PdfCrop() {
  const u = useUi();
  const state = usePdf();
  const [page, setPage] = useState(0);
  const [scope, setScope] = useState<"all" | "one">("all");
  const [mm, setMm] = useState({ top: "10", right: "10", bottom: "10", left: "10" });
  const saver = useSaver();
  const size = usePageSize(state.pdf?.doc, page);

  const margins = { top: Number(mm.top) || 0, right: Number(mm.right) || 0, bottom: Number(mm.bottom) || 0, left: Number(mm.left) || 0 };
  const wMm = size ? ptToMm(size.width) : 0;
  const hMm = size ? ptToMm(size.height) : 0;
  const tooBig = !!size && (margins.left + margins.right >= wMm || margins.top + margins.bottom >= hMm);
  const negative = Object.values(margins).some((v) => v < 0);
  // keeps the preview column about as tall as the margins column
  const PREVIEW = 300;

  const save = (pdf: PdfFile) =>
    saver.run(async () => {
      const doc = await editPdf(pdf.bytes);
      const pages = doc.getPages();
      for (const [i, p] of pages.entries()) {
        if (scope === "one" && i !== page) continue;
        const m = marginsForRotation(margins, p.getRotation().angle);
        const box = p.getCropBox();
        const width = box.width - mmToPt(m.left + m.right);
        const height = box.height - mmToPt(m.top + m.bottom);
        if (width <= 0 || height <= 0) throw new Error(`I margini sono più grandi della pagina ${i + 1}.`);
        p.setMediaBox(box.x + mmToPt(m.left), box.y + mmToPt(m.bottom), width, height);
        p.setCropBox(box.x + mmToPt(m.left), box.y + mmToPt(m.bottom), width, height);
      }
      savePdf(await doc.save(), `${pdf.name}_ritagliato.pdf`);
    });

  return (
    <SinglePdf state={{ ...state, clear: () => { state.clear(); setPage(0); } }} info="I margini si misurano dal bordo della pagina come la vedi. Il ritaglio nasconde il contenuto fuori dal riquadro, ma non lo cancella dal file.">
      {(pdf) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 min-w-0 md:order-last">
            <PdfFileBar pdf={pdf} onClear={() => { state.clear(); setPage(0); }}>
              <Button variant="primary" disabled={tooBig || negative || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
            </PdfFileBar>
            <Segmented fill value={scope} onChange={setScope} options={[{ value: "all", label: "Tutte le pagine" }, { value: "one", label: "Solo questa pagina" }]} />
            <div className="grid grid-cols-2 gap-3">
              {SIDES.map((s) => (
                <Field key={s.key} label={s.label}>
                  <TextInput type="number" inputMode="decimal" min={0} step="any" value={mm[s.key]} onChange={(e) => setMm({ ...mm, [s.key]: e.target.value })} suffixText="mm" />
                </Field>
              ))}
            </div>
            {size && (
              <div className="space-y-1">
                <Row label="Pagina" value={`${wMm.toFixed(0)} × ${hMm.toFixed(0)} mm`} />
                <Row label="Dopo il ritaglio" value={tooBig ? "—" : `${(wMm - margins.left - margins.right).toFixed(0)} × ${(hMm - margins.top - margins.bottom).toFixed(0)} mm`} />
              </div>
            )}
            {(tooBig || negative) && <Notice tone="warn">{negative ? "I margini non possono essere negativi." : "I margini sono più grandi della pagina."}</Notice>}
            {saver.error && <Notice tone="error">{saver.error}</Notice>}
          </div>
          <div className="space-y-3 min-w-0 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <IconButton disabled={page === 0} onClick={() => setPage(page - 1)} title="Pagina precedente"><ChevronLeft /></IconButton>
              <span className={cx("text-xs font-mono", u.muted)}>Pagina {page + 1} di {pdf.pages}</span>
              <IconButton disabled={page === pdf.pages - 1} onClick={() => setPage(page + 1)} title="Pagina successiva"><ChevronRight /></IconButton>
            </div>
            <ZoomPan resetKey={page}>
            <div className="relative">
              <PageThumb doc={pdf.doc} index={page} width={PREVIEW} />
              {size && !tooBig && (
                <div
                  className="absolute border-2 pointer-events-none"
                  style={{
                    borderColor: u.accentHex,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                    left: `${(margins.left / wMm) * 100}%`,
                    right: `${(margins.right / wMm) * 100}%`,
                    top: `${(margins.top / hMm) * 100}%`,
                    bottom: `${(margins.bottom / hMm) * 100}%`,
                  }}
                />
              )}
            </div>
            </ZoomPan>
          </div>
        </div>
      )}
    </SinglePdf>
  );
}
