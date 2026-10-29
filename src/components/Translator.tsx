import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, History, Send, Volume2 } from "lucide-react";
import { Select, Chips, Button, IconButton, CopyButton, TextArea, Panel, Notice, SectionTitle, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const MAX_CHARS = 5000; // keep in sync with MAX_TEXT_LENGTH in server.ts

const LANGUAGES = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "en", name: "Inglese", flag: "🇬🇧" },
  { code: "es", name: "Spagnolo", flag: "🇪🇸" },
  { code: "fr", name: "Francese", flag: "🇫🇷" },
  { code: "de", name: "Tedesco", flag: "🇩🇪" },
  { code: "pt", name: "Portoghese", flag: "🇵🇹" },
  { code: "ru", name: "Russo", flag: "🇷🇺" },
  { code: "zh", name: "Cinese (semplificato)", flag: "🇨🇳" },
  { code: "ja", name: "Giapponese", flag: "🇯🇵" },
  { code: "ko", name: "Coreano", flag: "🇰🇷" },
  { code: "ar", name: "Arabo", flag: "🇸🇦" },
  { code: "nl", name: "Olandese", flag: "🇳🇱" },
  { code: "pl", name: "Polacco", flag: "🇵🇱" },
  { code: "sv", name: "Svedese", flag: "🇸🇪" },
  { code: "tr", name: "Turco", flag: "🇹🇷" },
  { code: "el", name: "Greco", flag: "🇬🇷" },
];

const TONES = [
  { value: "natural", label: "Naturale" },
  { value: "formal", label: "Formale" },
  { value: "informal", label: "Informale" },
  { value: "technical", label: "Tecnico" },
];

interface HistoryItem {
  source: string;
  translated: string;
  from: string;
  to: string;
}

function TranslatorInner() {
  const u = useUi();
  const [from, setFrom] = useState("auto");
  const [to, setTo] = useState("en");
  const [tone, setTone] = useState("natural");
  const [source, setSource] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const translate = async () => {
    if (!source.trim()) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, sourceLang: from, targetLang: to, tone }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Errore del server (${res.status})`);
      if (!data.translation) throw new Error("Risposta senza traduzione.");
      setResult(data.translation);
      setHistory((prev) => [{ source, translated: data.translation, from, to }, ...prev].slice(0, 5));
    } catch (err) {
      if (controller.signal.aborted) return;
      setResult("");
      setError(err instanceof TypeError ? "Server di traduzione non raggiungibile. Avvia il progetto con `npm run dev` e configura GEMINI_API_KEY." : (err as Error).message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const swap = () => {
    if (from === "auto") return;
    setFrom(to);
    setTo(from);
    setSource(result);
    setResult(source);
  };

  const speak = (text: string, lang: string) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "auto" ? "it-IT" : lang;
    window.speechSynthesis.speak(utterance);
  };

  const langLabel = (code: string) => LANGUAGES.find((l) => l.code === code);

  return (
    <Stack>
      <Chips value={tone} onChange={setTone} options={TONES} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Lingua di origine">
          <option value="auto">🌐 Rileva lingua</option>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </Select>
        <IconButton onClick={swap} disabled={from === "auto"} title="Inverti lingue"><ArrowLeftRight className="w-4 h-4" /></IconButton>
        <Select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Lingua di destinazione">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel className="space-y-3">
          <TextArea rows={6} maxLength={MAX_CHARS} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Scrivi o incolla il testo da tradurre..." className="border-0 bg-transparent p-0 focus:border-0" />
          <div className={cx("flex items-center justify-between pt-2 border-t", u.divider)}>
            <span className={cx("text-[11px] font-mono", u.muted)}>{source.length} / {MAX_CHARS}</span>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => speak(source, from)} disabled={!source} title="Ascolta"><Volume2 className="w-4 h-4" /></IconButton>
              <Button size="sm" variant="primary" disabled={loading || !source.trim()} icon={<Send className="w-3.5 h-3.5" />} onClick={translate}>{loading ? "Traduzione..." : "Traduci"}</Button>
            </div>
          </div>
        </Panel>

        <Panel className="space-y-3 flex flex-col">
          <div className={cx("flex-1 min-h-[9rem] text-sm whitespace-pre-wrap break-words", u.text)} aria-live="polite">
            {loading ? <span className={u.muted}>Generazione della traduzione…</span> : result || <span className={u.muted}>La traduzione apparirà qui…</span>}
          </div>
          <div className={cx("flex items-center justify-between pt-2 border-t", u.divider)}>
            <span className={u.statLabel}>Risultato</span>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => speak(result, to)} disabled={!result} title="Ascolta"><Volume2 className="w-4 h-4" /></IconButton>
              <CopyButton text={result} label="Copia traduzione" />
            </div>
          </div>
        </Panel>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {history.length > 0 && (
        <div className="space-y-2">
          <SectionTitle><span className="inline-flex items-center gap-2"><History className="w-3.5 h-3.5" /> Recenti</span></SectionTitle>
          {history.map((item, i) => (
            <button key={i} type="button" onClick={() => { setSource(item.source); setResult(item.translated); setFrom(item.from); setTo(item.to); }} className={cx("w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs cursor-pointer", u.panel)}>
              <span className={cx("truncate", u.subtle)}>{langLabel(item.from)?.flag ?? "🌐"} {item.source}</span>
              <span className={u.muted}>→</span>
              <span className={cx("truncate font-semibold", u.text)}>{langLabel(item.to)?.flag} {item.translated}</span>
            </button>
          ))}
        </div>
      )}
    </Stack>
  );
}

// Nella versione pubblica (VITE_PUBLIC=1) il traduttore non è disponibile: serve il server locale con la chiave Gemini.
export default function Translator() {
  if (import.meta.env.VITE_PUBLIC === "1") {
    return <Notice>Il Traduttore funziona solo in locale, con il server attivo e la chiave Gemini configurata.</Notice>;
  }
  return <TranslatorInner />;
}
