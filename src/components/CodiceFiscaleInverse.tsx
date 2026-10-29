import { useState } from "react";
import { Calendar, MapPin, User } from "lucide-react";
import { Field, TextInput, Button, Panel, Row, Notice, SectionTitle, CopyButton, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { decode } from "../lib/codiceFiscale";
import type { Decoded } from "../lib/codiceFiscale";

export default function CodiceFiscaleInverse() {
  const u = useUi();
  const [input, setInput] = useState("");

  const cleaned = input.replace(/\s/g, "").toUpperCase();
  const outcome = cleaned.length === 16 ? decode(cleaned) : null;
  const error = outcome && "error" in outcome ? outcome.error : null;
  const result: Decoded | null = outcome && !("error" in outcome) ? outcome : null;
  const needsMore = cleaned.length > 0 && cleaned.length < 16;

  return (
    <Stack>
      <Field label="Codice fiscale (16 caratteri)">
        <div className="relative">
          <TextInput value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} maxLength={19} placeholder="es. RSSMRA80A01H501U" spellCheck={false} autoComplete="off" className="uppercase tracking-widest pr-11" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2"><CopyButton text={cleaned} label="Copia codice" /></div>
        </div>
      </Field>
      <div><Button size="sm" disabled={!input} onClick={() => setInput("")}>Svuota</Button></div>

      {needsMore && <p className={cx("text-xs", u.muted)}>{cleaned.length}/16 caratteri…</p>}
      {error && <Notice tone="error">{error}</Notice>}

      {result && (
        <div className="space-y-4">
          <Notice tone={result.checkValid ? "success" : "warn"}>
            {result.checkValid
              ? `Struttura e carattere di controllo validi (${result.code[15]}).`
              : `Carattere di controllo incoerente: dovrebbe essere "${result.expectedCheck}", non "${result.code[15]}".`}
            {result.omocodia && " Il codice presenta omocodia."}
          </Notice>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Panel className="flex items-center gap-3">
              <User className={cx("w-5 h-5 shrink-0", u.accent)} />
              <div><span className={u.statLabel}>Sesso</span><div className={cx("text-sm font-semibold", u.text)}>{result.sex}</div></div>
            </Panel>
            <Panel className="flex items-center gap-3">
              <Calendar className={cx("w-5 h-5 shrink-0", u.accent)} />
              <div><span className={u.statLabel}>Nascita</span><div className={cx("text-sm font-semibold", u.text)}>{result.day} {result.monthName} {result.year}</div></div>
            </Panel>
            <Panel className="flex items-center gap-3">
              <MapPin className={cx("w-5 h-5 shrink-0", u.accent)} />
              <div><span className={u.statLabel}>Luogo</span><div className={cx("text-sm font-semibold", u.text)}>{result.place ?? `Codice ${result.belfiore}`}</div></div>
            </Panel>
          </div>

          <Panel className="space-y-2">
            <SectionTitle>Composizione</SectionTitle>
            <div className="pt-1 space-y-1.5">
              <Row label="Cognome (1–3)" value={result.surnamePart} />
              <Row label="Nome (4–6)" value={result.namePart} />
              <Row label="Anno, mese, giorno (7–11)" value={result.code.slice(6, 11)} />
              <Row label="Luogo Belfiore (12–15)" value={result.code.slice(11, 15)} />
              <Row label="Controllo (16)" value={result.code[15]} />
            </div>
            <p className={cx("text-[11px] pt-1", u.muted)}>
              Il secolo è dedotto dalle ultime due cifre dell'anno: per nati prima del 1926 il risultato può essere sbagliato. Il codice non contiene nome e cognome per esteso, solo consonanti e vocali selezionate. Il nome del luogo è mostrato solo per i principali capoluoghi.
            </p>
          </Panel>
        </div>
      )}
    </Stack>
  );
}
