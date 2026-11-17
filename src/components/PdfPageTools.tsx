import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, RotateCw, Trash2, X } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { Button, Field, IconButton, Notice, Segmented, Stack, TextInput, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { useUnsaved } from "../ui/unsaved";
import { PageThumb, PdfDrop, PdfFileBar, SAMPLE_PAGES, SampleSheet, SinglePdf, baseName, editPdf, isPdf, pdfError, savePdf, usePdf, useSaver } from "../ui/PdfKit";
import type { PdfFile } from "../ui/PdfKit";
import { formatBytes } from "../lib/imageOps";
import { chunkPages, groupLabel, moveItem, parsePageList, parseRangeGroups } from "../lib/pdfPages";

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

/** One page in a grid: thumbnail, number, and the page's own buttons. Without `pdf` it shows a made-up sample page. */
function PageCard({ pdf, index, label, rotation = 0, marked, onClick, children, dragProps }: {
  pdf?: PdfFile;
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
        {pdf ? (
          <PageThumb doc={pdf.doc} index={index} width={THUMB} rotation={rotation} className={cx("shadow transition-opacity", marked && "opacity-30")} />
        ) : (
          <div className="flex items-center justify-center" style={{ width: THUMB, height: Math.round(THUMB * 1.414) }}>
            <div className={cx("transition-all", marked && "opacity-30")} style={{ transform: `rotate(${rotation}deg) scale(${rotation % 180 ? 0.7 : 1})` }}>
              <SampleSheet width={THUMB} />
            </div>
          </div>
        )}
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

/** The list of files shown before any is added: it works, but only on made-up names. */
const SAMPLE_FILES = [
  { name: "contratto", pages: 12 },
  { name: "allegati", pages: 4 },
  { name: "firme", pages: 2 },
];

export function PdfMerge() {
  const u = useUi();
  const [items, setItems] = useState<MergeItem[]>([]);
  const [sample, setSample] = useState(SAMPLE_FILES);
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
      <PdfDrop strip multiple onFiles={(files) => void add(files)} label="Trascina qui uno o più PDF" hint="Si uniscono nell'ordine dell'elenco: poi puoi spostarli" />
      {items.length > 0 ? (
        <>
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
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" disabled={items.length < 2 || saver.busy} onClick={() => void merge()}>Salva</Button>
            <span className={cx("text-xs", u.muted)}>{items.length < 2 ? "Servono almeno due PDF." : `${items.length} file, ${total} pagine in tutto`}</span>
            <Button size="sm" variant="danger" icon={<Trash2 />} className="ml-auto" onClick={() => setItems([])}>Svuota</Button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className={cx("text-xs font-mono", u.muted)}>Elenco d'esempio</div>
          <div className={cx("border divide-y", u.divider)}>
            {sample.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3 px-3 py-2 text-xs">
                <span className={cx("w-6 font-mono", u.muted)}>{i + 1}</span>
                <span className={cx("flex-1 min-w-0 truncate", u.text)}>{item.name}.pdf</span>
                <span className={cx("font-mono", u.muted)}>{item.pages} pag.</span>
                <IconButton disabled={i === 0} onClick={() => setSample(moveItem(sample, i, i - 1))} title="Sposta su"><ArrowUp /></IconButton>
                <IconButton disabled={i === sample.length - 1} onClick={() => setSample(moveItem(sample, i, i + 1))} title="Sposta giù"><ArrowDown /></IconButton>
                <IconButton onClick={() => setSample(sample.filter((x) => x.name !== item.name))} title="Togli dall'elenco"><Trash2 /></IconButton>
              </div>
            ))}
          </div>
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
  // before a PDF is loaded the parts are worked out on a made-up document
  const count = state.pdf?.pages ?? SAMPLE_PAGES;

  const groups: number[][] | string = useMemo(() => {
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

  const options = (
    <>
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
    </>
  );

  const parts = (pdf: PdfFile | null) => (
    <>
      <span className={cx("text-xs", u.muted)}>{typeof groups === "string" ? "—" : `${groups.length} parti${pdf ? "" : ` · su un documento d'esempio di ${count} pagine`}`}</span>
      <div className={cx("max-h-[420px] overflow-auto border divide-y", u.divider)}>
        {typeof groups !== "string" &&
          groups.map((group, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs">
              <span className={cx("font-mono", u.muted)}>Parte {i + 1} · {groupLabel(group)}</span>
              {pdf && <Button size="sm" disabled={saver.busy} onClick={() => void save(pdf, groups, [i])}>Salva</Button>}
            </div>
          ))}
      </div>
    </>
  );

  return (
    <SinglePdf
      state={state}
      info="Ogni parte diventa un PDF separato. Se scarichi tutte le parti insieme, il browser può chiederti il permesso per più download."
      empty={(drop) => (
        <>
          {drop}
          {options}
          {parts(null)}
        </>
      )}
    >
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={state.clear}>
            <Button variant="primary" disabled={typeof groups === "string" || !groups.length || saver.busy} onClick={() => typeof groups !== "string" && void save(pdf, groups, groups.map((_, i) => i))}>
              {typeof groups === "string" ? "Salva" : `Salva (${groups.length})`}
            </Button>
          </PdfFileBar>
          {options}
          {saver.error && <Notice tone="error">{saver.error}</Notice>}
          {parts(pdf)}
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
  // what was marked on the sample pages is dropped when a real PDF arrives
  useEffect(() => {
    setRemoved(new Set());
  }, [state.pdf]);

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

  const body = (pdf: PdfFile | null) => {
    const pages = pdf?.pages ?? SAMPLE_PAGES;
    return (
      <>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Pagine da togliere" className="w-72">
            <TextInput value={typed} placeholder="es. 2, 5-7" onChange={(e) => setTyped(e.target.value)} />
          </Field>
          <Button
            disabled={!typed.trim()}
            onClick={() => {
              const list = parsePageList(typed, pages);
              if (typeof list === "string") return setTypedError(list);
              setTypedError(null);
              setRemoved(new Set([...removed, ...list]));
            }}
          >
            Segna
          </Button>
          <Button disabled={!removed.size} onClick={() => setRemoved(new Set())}>Nessuna</Button>
          <span className={cx("text-xs", u.muted)}>{removed.size} da togliere · restano {pages - removed.size}</span>
        </div>
        {typedError && <Notice tone="warn">{typedError}</Notice>}
        {removed.size === pages && <Notice tone="warn">Non puoi togliere tutte le pagine.</Notice>}
        {saver.error && <Notice tone="error">{saver.error}</Notice>}
        <div className={GRID} style={GRID_COLUMNS}>
          {Array.from({ length: pages }, (_, i) => (
            <PageCard key={i} pdf={pdf ?? undefined} index={i} marked={removed.has(i)} onClick={() => toggle(i)} />
          ))}
        </div>
      </>
    );
  };

  return (
    <SinglePdf
      state={{ ...state, clear: () => { state.clear(); setRemoved(new Set()); } }}
      info="Clicca sulle pagine da togliere (diventano barrate) oppure scrivile nel campo. Il PDF originale non cambia: ne scarichi una copia."
      empty={(drop) => (
        <>
          {drop}
          {body(null)}
        </>
      )}
    >
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={() => { state.clear(); setRemoved(new Set()); }}>
            <Button variant="primary" disabled={!removed.size || removed.size === pdf.pages || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
          </PdfFileBar>
          {body(pdf)}
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
  useEffect(() => {
    setTurns({});
  }, [state.pdf]);
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

  const body = (pdf: PdfFile | null) => {
    const pages = pdf?.pages ?? SAMPLE_PAGES;
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<RotateCcw />} onClick={() => Array.from({ length: pages }, (_, i) => turn(i, -90))}>Tutte a sinistra</Button>
          <Button icon={<RotateCw />} onClick={() => Array.from({ length: pages }, (_, i) => turn(i, 90))}>Tutte a destra</Button>
          <Button disabled={!changed} onClick={reset}>Ripristina</Button>
          <span className={cx("text-xs", u.muted)}>{changed === 1 ? "1 pagina ruotata" : `${changed} pagine ruotate`}</span>
        </div>
        {saver.error && <Notice tone="error">{saver.error}</Notice>}
        <div className={GRID} style={GRID_COLUMNS}>
          {Array.from({ length: pages }, (_, i) => (
            <PageCard key={i} pdf={pdf ?? undefined} index={i} rotation={turns[i] ?? 0} label={turns[i] ? `Pagina ${i + 1} · ${turns[i]}°` : undefined}>
              <IconButton onClick={() => turn(i, -90)} title="Ruota a sinistra"><RotateCcw /></IconButton>
              <IconButton onClick={() => turn(i, 90)} title="Ruota a destra"><RotateCw /></IconButton>
            </PageCard>
          ))}
        </div>
      </>
    );
  };

  return (
    <SinglePdf
      state={{ ...state, clear: () => { state.clear(); reset(); } }}
      info="Ruota ogni pagina con le sue frecce, o tutte insieme. La rotazione si somma a quella che la pagina ha già."
      empty={(drop) => (
        <>
          {drop}
          {body(null)}
        </>
      )}
    >
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={() => { state.clear(); reset(); }}>
            <Button variant="primary" disabled={!changed || saver.busy} onClick={() => void save(pdf)}>Salva</Button>
          </PdfFileBar>
          {body(pdf)}
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
  useEffect(() => {
    setOrder(null);
  }, [state.pdf]);

  const save = (pdf: PdfFile, list: number[]) =>
    saver.run(async () => {
      savePdf(await pickPages(await editPdf(pdf.bytes), list), `${pdf.name}_riordinato.pdf`);
    });

  const orderFor = (pages: number) => (order && order.length === pages ? order : Array.from({ length: pages }, (_, i) => i));

  const body = (pdf: PdfFile | null) => {
    const pages = pdf?.pages ?? SAMPLE_PAGES;
    const list = orderFor(pages);
    const moved = list.some((p, i) => p !== i);
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setOrder([...list].reverse())}>Inverti ordine</Button>
          <Button disabled={!moved} onClick={() => setOrder(null)}>Ripristina</Button>
          <span className={cx("text-xs", u.muted)}>{moved ? "Ordine cambiato" : "Ordine originale"}</span>
        </div>
        {saver.error && <Notice tone="error">{saver.error}</Notice>}
        <div className={GRID} style={GRID_COLUMNS}>
          {list.map((page, pos) => (
            <PageCard
              key={page}
              pdf={pdf ?? undefined}
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
  };

  return (
    <SinglePdf
      state={{ ...state, clear: () => { state.clear(); setOrder(null); } }}
      info="Trascina le pagine nella nuova posizione, oppure usa le frecce sotto ciascuna."
      empty={(drop) => (
        <>
          {drop}
          {body(null)}
        </>
      )}
    >
      {(pdf) => (
        <>
          <PdfFileBar pdf={pdf} onClear={() => { state.clear(); setOrder(null); }}>
            <Button variant="primary" disabled={!orderFor(pdf.pages).some((p, i) => p !== i) || saver.busy} onClick={() => void save(pdf, orderFor(pdf.pages))}>Salva</Button>
          </PdfFileBar>
          {body(pdf)}
        </>
      )}
    </SinglePdf>
  );
}
