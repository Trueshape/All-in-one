import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, TextArea, Button, Panel, SectionTitle, Notice, Stack, Toggle, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

type Op = { type: "same" | "add" | "del"; text: string; a?: number; b?: number };

const MAX_LINES = 1500;

const SAMPLE_A = "DailySphere è una raccolta di utilità web.\nInclude diversi calcolatori e convertitori.\nDisponibile su tutti i dispositivi.\nCreato in React e Tailwind CSS.";
const SAMPLE_B = "DailySphere è la migliore suite di utilità web!\nInclude diversi calcolatori e convertitori.\nDisponibile su tutti i dispositivi mobili e desktop.\nCreato in React e Tailwind CSS.\nOpen source.";

/** Line diff based on the longest common subsequence. */
function diffLines(a: string[], b: string[], norm: (s: string) => string): Op[] {
  const n = a.length;
  const m = b.length;
  const A = a.map(norm);
  const B = b.map(norm);
  // lcs[i][j] = LCS length of A[i..] and B[j..]
  const lcs: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = A[i] === B[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      ops.push({ type: "same", text: b[j], a: i + 1, b: j + 1 });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: "del", text: a[i], a: i + 1 });
      i++;
    } else {
      ops.push({ type: "add", text: b[j], b: j + 1 });
      j++;
    }
  }
  while (i < n) ops.push({ type: "del", text: a[i], a: ++i });
  while (j < m) ops.push({ type: "add", text: b[j], b: ++j });
  return ops;
}

export default function TextDiff() {
  const u = useUi();
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [ignoreSpace, setIgnoreSpace] = useState(false);

  const tooLong = textA.split("\n").length > MAX_LINES || textB.split("\n").length > MAX_LINES;

  const ops = useMemo(() => {
    if (tooLong || (!textA && !textB)) return [];
    const norm = ignoreSpace ? (s: string) => s.trim().replace(/\s+/g, " ") : (s: string) => s;
    return diffLines(textA.split("\n"), textB.split("\n"), norm);
  }, [textA, textB, ignoreSpace, tooLong]);

  const added = ops.filter((o) => o.type === "add").length;
  const removed = ops.filter((o) => o.type === "del").length;

  const rowClass = {
    same: u.muted,
    add: "bg-emerald-500/10 text-emerald-400",
    del: "bg-red-500/10 text-red-400",
  };
  const mark = { same: " ", add: "+", del: "-" };

  return (
    <Stack>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle checked={ignoreSpace} onChange={setIgnoreSpace} label="Ignora differenze di spazi" />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setTextA(SAMPLE_A); setTextB(SAMPLE_B); }}>Esempio</Button>
          <Button size="sm" variant="danger" disabled={!textA && !textB} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => { setTextA(""); setTextB(""); }}>
            Svuota
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Testo originale (A)">
          <TextArea rows={7} value={textA} onChange={(e) => setTextA(e.target.value)} placeholder="Incolla qui la prima versione..." />
        </Field>
        <Field label="Testo modificato (B)">
          <TextArea rows={7} value={textB} onChange={(e) => setTextB(e.target.value)} placeholder="Incolla qui la nuova versione..." />
        </Field>
      </div>

      {tooLong && <Notice tone="warn">Il confronto è limitato a {MAX_LINES} righe per testo.</Notice>}

      <Panel inset className="p-0 overflow-hidden">
        <div className={cx("flex items-center justify-between px-4 py-2 border-b", u.divider)}>
          <SectionTitle>Differenze</SectionTitle>
          <span className="text-[11px] font-mono">
            <span className="text-emerald-400">+{added}</span> <span className="text-red-400">−{removed}</span>
          </span>
        </div>
        <div className="max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed">
          {ops.length === 0 ? (
            <p className={cx("p-8 text-center", u.muted)}>Inserisci del testo nelle due aree per vedere le differenze riga per riga.</p>
          ) : (
            ops.map((op, idx) => (
              <div key={idx} className={cx("flex gap-3 px-3 py-0.5", rowClass[op.type])}>
                <span className="w-7 text-right opacity-50 select-none shrink-0">{op.a ?? ""}</span>
                <span className="w-7 text-right opacity-50 select-none shrink-0">{op.b ?? ""}</span>
                <span className="w-3 font-bold select-none shrink-0">{mark[op.type]}</span>
                <span className="whitespace-pre-wrap break-all flex-1">{op.text || " "}</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </Stack>
  );
}
