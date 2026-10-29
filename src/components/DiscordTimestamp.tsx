import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Field, TextInput, TextArea, Chips, Panel, SectionTitle, Notice, Stack, Row, CopyButton, useCopy, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const pad = (n: number) => String(n).padStart(2, "0");
const nowParts = () => {
  const d = new Date();
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });
function relative(d: Date): string {
  const seconds = Math.round((d.getTime() - Date.now()) / 1000);
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [["year", 31_536_000], ["month", 2_592_000], ["day", 86_400], ["hour", 3600], ["minute", 60]];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(seconds, "second");
}

const FORMATS: Array<{ code: string; label: string; preview: (d: Date) => string }> = [
  { code: "t", label: "Ora breve", preview: (d) => d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) },
  { code: "T", label: "Ora estesa", preview: (d) => d.toLocaleTimeString("it-IT") },
  { code: "d", label: "Data breve", preview: (d) => d.toLocaleDateString("it-IT") },
  { code: "D", label: "Data estesa", preview: (d) => d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) },
  { code: "f", label: "Data e ora", preview: (d) => d.toLocaleString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
  { code: "F", label: "Data e ora estese", preview: (d) => d.toLocaleString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
  { code: "R", label: "Tempo relativo", preview: relative },
];

const MARKUP: Array<{ id: string; label: string; wrap: (s: string) => string }> = [
  { id: "bold", label: "Grassetto", wrap: (s) => `**${s}**` },
  { id: "italic", label: "Corsivo", wrap: (s) => `*${s}*` },
  { id: "underline", label: "Sottolineato", wrap: (s) => `__${s}__` },
  { id: "strike", label: "Barrato", wrap: (s) => `~~${s}~~` },
  { id: "spoiler", label: "Spoiler", wrap: (s) => `||${s}||` },
  { id: "code", label: "Codice", wrap: (s) => `\`${s}\`` },
  { id: "block", label: "Blocco codice", wrap: (s) => `\`\`\`\n${s}\n\`\`\`` },
  { id: "quote", label: "Citazione", wrap: (s) => s.split("\n").map((l) => `> ${l}`).join("\n") },
  { id: "header", label: "Titolo", wrap: (s) => `# ${s}` },
  { id: "subtext", label: "Sottotesto", wrap: (s) => `-# ${s}` },
  { id: "silent", label: "Link senza anteprima", wrap: (s) => `<${s}>` },
];

export default function DiscordTimestamp() {
  const u = useUi();
  const initial = useMemo(nowParts, []);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [markupId, setMarkupId] = useState("bold");
  const [input, setInput] = useState("");
  const { copied, copy } = useCopy();
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const when = useMemo(() => {
    const d = new Date(`${date}T${time || "00:00"}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [date, time]);
  const unix = when ? Math.floor(when.getTime() / 1000) : null;

  const formatted = input ? MARKUP.find((m) => m.id === markupId)!.wrap(input) : "";

  const copyTag = async (tag: string) => {
    await navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag((t) => (t === tag ? null : t)), 1800);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SectionTitle>Timestamp</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Ora"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
          </div>

          {unix === null ? (
            <Notice tone="warn">Inserisci una data e un'ora valide.</Notice>
          ) : (
            <>
              <Panel className="p-3"><Row label="Unix timestamp (secondi)" value={unix} /></Panel>
              <div className={cx("border divide-y", u.divider, u.id === "sophisticated" && "rounded-xl overflow-hidden")}>
                {FORMATS.map((f) => {
                  const tag = `<t:${unix}:${f.code}>`;
                  return (
                    <button type="button" key={f.code} onClick={() => copyTag(tag)} className={cx("w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-white/5 transition-colors", u.divider)}>
                      <span className="min-w-0">
                        <span className={cx("block text-xs font-semibold", u.text)}>{f.label}</span>
                        <span className={cx("block text-[10px] font-mono truncate", u.muted)}>{tag}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className={cx("text-[11px] font-mono", u.subtle)}>{f.preview(when!)}</span>
                        {copiedTag === tag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className={cx("w-3.5 h-3.5", u.muted)} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Formattazione testo</SectionTitle>
          <Field label="Testo">
            <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Scrivi il testo da formattare..." />
          </Field>
          <Chips value={markupId} onChange={setMarkupId} options={MARKUP.map((m) => ({ value: m.id, label: m.label }))} />
          <Panel inset className="relative min-h-[88px]">
            <span className={u.statLabel}>Risultato</span>
            <pre className={cx("mt-1 pr-8 text-xs font-mono whitespace-pre-wrap break-all select-all", u.text)}>{formatted || "—"}</pre>
            <div className="absolute top-2 right-2"><CopyButton text={formatted} label={copied ? "Copiato" : "Copia"} /></div>
          </Panel>
        </div>
      </div>

      <Notice>
        Discord mostra i timestamp nel fuso orario di chi legge. L'orario inserito è interpretato nel tuo fuso locale.
      </Notice>
    </Stack>
  );
}
