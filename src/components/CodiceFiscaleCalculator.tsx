import { useState } from "react";
import type { FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Field, TextInput, Select, Segmented, Button, Panel, Row, Notice, SectionTitle, ResultCard, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { COMUNI, encode } from "../lib/codiceFiscale";
import type { EncodeParts } from "../lib/codiceFiscale";
import CodiceFiscaleInverse from "./CodiceFiscaleInverse";

export default function CodiceFiscaleCalculator() {
  const u = useUi();
  const [tab, setTab] = useState<"calc" | "inv">("calc");
  const [surname, setSurname] = useState("");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [placeMode, setPlaceMode] = useState<"list" | "custom">("list");
  const [listCode, setListCode] = useState(COMUNI.find((c) => c.name.startsWith("Roma"))?.code ?? COMUNI[0].code);
  const [customCode, setCustomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; parts: EncodeParts } | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const outcome = encode({ surname, name, birthDate, sex, belfiore: placeMode === "list" ? listCode : customCode });
    if ("error" in outcome) {
      setError(outcome.error);
      setResult(null);
    } else {
      setError(null);
      setResult(outcome);
    }
  };

  const reset = () => {
    setSurname(""); setName(""); setBirthDate(""); setSex("M"); setPlaceMode("list"); setCustomCode(""); setError(null); setResult(null);
  };

  return (
    <Stack>
      <Segmented value={tab} onChange={setTab} options={[{ value: "calc", label: "Calcola" }, { value: "inv", label: "Decodifica" }]} />

      {tab === "inv" ? (
        <CodiceFiscaleInverse />
      ) : (
        <>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Cognome"><TextInput value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="es. Rossi" autoComplete="off" /></Field>
              <Field label="Nome"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Mario" autoComplete="off" /></Field>
              <Field label="Data di nascita"><TextInput type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></Field>
              <Field label="Sesso">
                <Segmented value={sex} onChange={setSex} options={[{ value: "M", label: "Maschio" }, { value: "F", label: "Femmina" }]} />
              </Field>
            </div>

            <Panel className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionTitle>Luogo di nascita</SectionTitle>
                <Segmented value={placeMode} onChange={setPlaceMode} options={[{ value: "list", label: "Capoluoghi" }, { value: "custom", label: "Altro / estero" }]} />
              </div>
              {placeMode === "list" ? (
                <Select value={listCode} onChange={(e) => setListCode(e.target.value)}>
                  {COMUNI.map((c) => <option key={c.code} value={c.code}>{c.name} · {c.code}</option>)}
                </Select>
              ) : (
                <Field label="Codice Belfiore" hint="Codice catastale di 4 caratteri del comune (es. D612 per Firenze) o dello Stato estero (inizia con Z).">
                  <TextInput value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase())} maxLength={4} placeholder="es. H501" className="uppercase tracking-widest" />
                </Field>
              )}
            </Panel>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" className="flex-1">Calcola codice fiscale</Button>
              <Button onClick={reset} title="Svuota i campi" aria-label="Svuota i campi"><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </form>

          {error && <Notice tone="error">{error}</Notice>}

          {result && (
            <div className="space-y-4">
              <ResultCard label="Il tuo codice fiscale" value={<span className="tracking-widest select-all">{result.code}</span>} copyText={result.code} />
              <Panel className="space-y-2">
                <SectionTitle>Composizione</SectionTitle>
                <div className="pt-1 space-y-1.5">
                  <Row label="Cognome" value={result.parts.surname} />
                  <Row label="Nome" value={result.parts.name} />
                  <Row label="Anno, mese, giorno e sesso" value={result.parts.date} />
                  <Row label="Luogo (Belfiore)" value={result.parts.belfiore} />
                  <Row label="Carattere di controllo" value={result.parts.check} tone="good" />
                </div>
                <p className={cx("text-[11px] pt-1", u.muted)}>I dati restano nel browser e non vengono inviati altrove. Il calcolo non gestisce l'omocodia.</p>
              </Panel>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}
