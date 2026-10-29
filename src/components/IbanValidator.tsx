import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Field, TextInput, Chips, Panel, Row, SectionTitle, CopyButton, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

/** Total IBAN length per country (ISO 13616 registry). */
const COUNTRIES: Record<string, { name: string; length: number }> = {
  AT: { name: "Austria", length: 20 }, BE: { name: "Belgio", length: 16 }, BG: { name: "Bulgaria", length: 22 },
  CH: { name: "Svizzera", length: 21 }, CY: { name: "Cipro", length: 28 }, CZ: { name: "Cechia", length: 24 },
  DE: { name: "Germania", length: 22 }, DK: { name: "Danimarca", length: 18 }, EE: { name: "Estonia", length: 20 },
  ES: { name: "Spagna", length: 24 }, FI: { name: "Finlandia", length: 18 }, FR: { name: "Francia", length: 27 },
  GB: { name: "Regno Unito", length: 22 }, GR: { name: "Grecia", length: 27 }, HR: { name: "Croazia", length: 21 },
  HU: { name: "Ungheria", length: 28 }, IE: { name: "Irlanda", length: 22 }, IS: { name: "Islanda", length: 26 },
  IT: { name: "Italia", length: 27 }, LI: { name: "Liechtenstein", length: 21 }, LT: { name: "Lituania", length: 20 },
  LU: { name: "Lussemburgo", length: 20 }, LV: { name: "Lettonia", length: 21 }, MC: { name: "Monaco", length: 27 },
  MT: { name: "Malta", length: 31 }, NL: { name: "Paesi Bassi", length: 18 }, NO: { name: "Norvegia", length: 15 },
  PL: { name: "Polonia", length: 28 }, PT: { name: "Portogallo", length: 25 }, RO: { name: "Romania", length: 24 },
  SE: { name: "Svezia", length: 24 }, SI: { name: "Slovenia", length: 19 }, SK: { name: "Slovacchia", length: 24 },
  SM: { name: "San Marino", length: 27 },
};

/** A few well-known Italian ABI codes (indicative only). */
const ABI: Record<string, string> = {
  "01005": "BNL", "01030": "Banca Monte dei Paschi di Siena", "02008": "UniCredit", "03015": "FinecoBank",
  "03032": "Credem", "03069": "Intesa Sanpaolo", "03268": "Banca Sella", "03335": "ING Bank",
  "05034": "Banco BPM", "05387": "BPER Banca", "05696": "Banca Popolare di Sondrio", "06230": "Crédit Agricole Italia",
  "07601": "Poste Italiane",
};

const SAMPLES = [
  { label: "Italia · Intesa", iban: "IT35O0306901600000000012345" },
  { label: "Italia · Poste", iban: "IT58Y0760101600000000987654" },
  { label: "Germania", iban: "DE18100110012612345678" },
  { label: "Francia", iban: "FR1420041010050500013M02606" },
  { label: "Spagna", iban: "ES9121000418450200051332" },
];

/** ISO 7064 MOD-97-10, computed digit by digit so it works for any length. */
function mod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder;
}

export default function IbanValidator() {
  const u = useUi();
  const [raw, setRaw] = useState("");

  const iban = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const formatted = iban.replace(/(.{4})/g, "$1 ").trim();

  const result = useMemo(() => {
    if (!iban) return null;
    const country = COUNTRIES[iban.slice(0, 2)];
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return { valid: false, reason: "Formato non valido: servono 2 lettere, 2 cifre di controllo e il codice del conto." };
    if (!country) return { valid: false, reason: "Codice paese non riconosciuto." };
    if (iban.length !== country.length) return { valid: false, reason: `Lunghezza errata per ${country.name}: attesi ${country.length} caratteri, inseriti ${iban.length}.` };
    if (mod97(iban) !== 1) return { valid: false, reason: "Le cifre di controllo (MOD-97) non corrispondono." };
    return { valid: true, reason: `Cifre di controllo corrette (${iban.length} caratteri).` };
  }, [iban]);

  const isItalian = iban.startsWith("IT") && iban.length === 27;
  const abi = isItalian ? iban.slice(5, 10) : "";
  const country = COUNTRIES[iban.slice(0, 2)];

  return (
    <Stack>
      <Field label="Codice IBAN">
        <div className="relative">
          <TextInput value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="es. IT35 O030 6901 6000 0000 0012 345" spellCheck={false} autoComplete="off" className="uppercase tracking-wider pr-11"
            style={result ? { borderColor: result.valid ? "rgb(52 211 153 / 0.7)" : "rgb(248 113 113 / 0.7)" } : undefined} />
          <div className="absolute right-1 top-1/2 -translate-y-1/2"><CopyButton text={formatted} label="Copia IBAN formattato" /></div>
        </div>
      </Field>

      <div className="space-y-2">
        <span className={u.statLabel}>Esempi</span>
        <Chips value={"" as string} onChange={(v) => setRaw(v)} options={SAMPLES.map((s) => ({ value: s.iban, label: s.label }))} />
      </div>

      {result && (
        <Panel className={cx("flex items-start gap-3", result.valid ? "border-emerald-500/40" : "border-red-500/40")}>
          {result.valid ? <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" /> : <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />}
          <div>
            <p className={cx("text-sm font-semibold", result.valid ? "text-emerald-300" : "text-red-300")}>{result.valid ? "IBAN valido" : "IBAN non valido"}</p>
            <p className={cx("text-xs mt-0.5", u.subtle)}>{result.reason}</p>
          </div>
        </Panel>
      )}

      {iban.length >= 4 && (
        <Panel className="space-y-2">
          <SectionTitle>Struttura</SectionTitle>
          <div className="pt-1 space-y-1.5">
            <Row label="Paese" value={`${iban.slice(0, 2)} · ${country?.name ?? "sconosciuto"}`} />
            <Row label="Cifre di controllo" value={iban.slice(2, 4)} />
            {isItalian ? (
              <>
                <Row label="CIN" value={iban.slice(4, 5)} />
                <Row label="ABI (banca)" value={`${abi}${ABI[abi] ? ` · ${ABI[abi]}` : ""}`} />
                <Row label="CAB (filiale)" value={iban.slice(10, 15)} />
                <Row label="Numero di conto" value={iban.slice(15)} />
              </>
            ) : (
              <Row label="Coordinate bancarie (BBAN)" value={iban.slice(4) || "—"} />
            )}
          </div>
        </Panel>
      )}

      <Notice>
        La validità è verificata con l'algoritmo MOD-97 (ISO 13616) direttamente nel browser: nessun dato viene inviato altrove. Il nome della banca è indicativo e non garantisce che il conto esista.
      </Notice>
    </Stack>
  );
}
