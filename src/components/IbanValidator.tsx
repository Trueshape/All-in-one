import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Building2,
  Globe,
  CreditCard,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

// IBAN Country standard lengths and patterns
interface CountrySpec {
  name: string;
  length: number;
  sepa: boolean;
  bankNameLookup?: (bankCode: string) => string | null;
}

const IBAN_COUNTRIES: Record<string, CountrySpec> = {
  IT: {
    name: "Italia",
    length: 27,
    sepa: true,
    bankNameLookup: (code) => {
      const banks: Record<string, string> = {
        "03069": "Intesa Sanpaolo",
        "02008": "UniCredit",
        "07601": "Poste Italiane (Postepay/BancoPosta)",
        "05034": "Banco BPM",
        "05387": "BPER Banca",
        "03015": "FinecoBank",
        "03058": "Mediobanca / CheBanca!",
        "03268": "Banca Sella",
        "06230": "Crédit Agricole Italia",
        "03104": "ING Bank Italia",
        "03111": "BNL Gruppo BNP Paribas",
        "03127": "Banca Mediolanum",
        "03226": "Illimity Bank",
        "03608": "Hype / Banca Sella",
        "03475": "BFF Bank",
      };
      return banks[code] || null;
    },
  },
  DE: {
    name: "Germania",
    length: 22,
    sepa: true,
    bankNameLookup: (code) => {
      if (code.startsWith("100")) return "Deutsche Bundesbank";
      if (code.startsWith("500")) return "Deutsche Bank";
      if (code.startsWith("1007")) return "N26 Bank";
      if (code.startsWith("370")) return "Commerzbank";
      return "Banca Tedesca";
    },
  },
  FR: { name: "Francia", length: 27, sepa: true },
  ES: { name: "Spagna", length: 24, sepa: true },
  GB: { name: "Regno Unito", length: 22, sepa: true },
  CH: { name: "Svizzera", length: 21, sepa: true },
  AT: { name: "Austria", length: 20, sepa: true },
  BE: { name: "Belgio", length: 16, sepa: true },
  NL: { name: "Paesi Bassi", length: 18, sepa: true },
  PT: { name: "Portogallo", length: 25, sepa: true },
  IE: { name: "Irlanda", length: 22, sepa: true },
  LU: { name: "Lussemburgo", length: 20, sepa: true },
  LT: { name: "Lituania (es. Revolut LT)", length: 20, sepa: true },
  PL: { name: "Polonia", length: 28, sepa: true },
  RO: { name: "Romania", length: 24, sepa: true },
  US: { name: "Stati Uniti (Routing ABA)", length: 0, sepa: false },
};

// Sample valid IBANs for test button (Calculated MOD-97 compliant)
const SAMPLE_IBANS = [
  { label: "Italia (Intesa)", iban: "IT35O0306901600000000012345" },
  { label: "Italia (Poste)", iban: "IT58Y0760101600000000987654" },
  { label: "Italia (UniCredit)", iban: "IT51F0200801600000000012345" },
  { label: "Germania (N26)", iban: "DE18100110012612345678" },
  { label: "Francia (BNP)", iban: "FR1420041010050500013M02606" },
  { label: "Spagna (BBVA)", iban: "ES9121000418450200051332" },
  { label: "Lituania (Revolut)", iban: "LT983250011234567890" },
];

export default function IbanValidator() {
  const [rawIban, setRawIban] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Clean IBAN
  const iban = rawIban.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  // Validate MOD 97 Checksum using BigInt
  const validateMod97 = (code: string): boolean => {
    if (code.length < 15 || code.length > 34) return false;

    // Rearrange: move first 4 chars to end
    const rearranged = code.substring(4) + code.substring(0, 4);

    // Convert letters to numbers (A=10, B=11, ..., Z=35)
    let numericStr = "";
    for (let i = 0; i < rearranged.length; i++) {
      const char = rearranged[i];
      if (/[A-Z]/.test(char)) {
        numericStr += (char.charCodeAt(0) - 55).toString();
      } else if (/[0-9]/.test(char)) {
        numericStr += char;
      } else {
        return false;
      }
    }

    try {
      return BigInt(numericStr) % 97n === 1n;
    } catch {
      return false;
    }
  };

  // Perform Analysis
  const countryCode = iban.substring(0, 2);
  const countryInfo = IBAN_COUNTRIES[countryCode];
  const isValidMod97 = validateMod97(iban);
  const isLengthValid = countryInfo ? iban.length === countryInfo.length : iban.length >= 15 && iban.length <= 34;
  const isValid = iban.length > 0 && isLengthValid && isValidMod97;

  // Italian IBAN Structure Breakdown
  const isItalian = countryCode === "IT" && iban.length === 27;
  const checkDigits = iban.substring(2, 4);
  const cin = isItalian ? iban.substring(4, 5) : "";
  const abi = isItalian ? iban.substring(5, 10) : "";
  const cab = isItalian ? iban.substring(10, 15) : "";
  const accountNumber = isItalian ? iban.substring(15, 27) : iban.substring(4);

  const bankName = isItalian && countryInfo?.bankNameLookup ? countryInfo.bankNameLookup(abi) : null;

  // Format IBAN with spaces every 4 characters
  const formattedIban = iban.replace(/(.{4})/g, "$1 ").trim();

  const handleCopy = () => {
    if (!formattedIban) return;
    navigator.clipboard.writeText(formattedIban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Description */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Verifica & Validatore IBAN Bancario</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Valida codici IBAN con algoritmo ufficiale ISO 13616 MOD-97 e rileva istituto bancario.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-500 font-mono">Esempi:</span>
          {SAMPLE_IBANS.map((sample) => (
            <button
              key={sample.label}
              onClick={() => setRawIban(sample.iban)}
              className="px-2 py-0.5 text-[10px] font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400 rounded transition-all cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="space-y-2">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Inserisci Codice IBAN
        </label>
        <div className="relative">
          <input
            type="text"
            value={rawIban}
            onChange={(e) => setRawIban(e.target.value)}
            placeholder="es. IT02 L 03069 01600 000000012345"
            className={`w-full bg-zinc-950/80 border text-sm sm:text-base font-mono uppercase tracking-widest px-4 py-3 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all pr-12 ${
              iban.length === 0
                ? "border-zinc-800 focus:border-zinc-600"
                : isValid
                ? "border-emerald-500/80 focus:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "border-rose-500/80 focus:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
            }`}
          />
          {formattedIban && (
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded transition-colors"
              title="Copia IBAN Formattato"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Validation Status Box */}
      {iban.length > 0 && (
        <div
          className={`p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
            isValid
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {isValid ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-7 h-7 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold uppercase tracking-wider">
                  {isValid ? "IBAN Valido Corretto" : "IBAN Non Valido / Errato"}
                </span>
                {countryInfo?.sepa && isValid && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                    Area SEPA
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-300 mt-0.5">
                {isValid
                  ? `Verifica cifre di controllo superata (${iban.length} caratteri).`
                  : !countryInfo
                  ? "Codice paese non riconosciuto."
                  : !isLengthValid
                  ? `Lunghezza errata per ${countryInfo.name}: attesi ${countryInfo.length} caratteri, inseriti ${iban.length}.`
                  : "Le cifre di controllo (checksum MOD-97) non corrispondono."}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded transition-all shrink-0 cursor-pointer"
          >
            {copied ? "Copiato!" : "Copia Formattato"}
          </button>
        </div>
      )}

      {/* IBAN Structure Breakdown */}
      {iban.length >= 4 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Struttura Dettagliata IBAN</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Country */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">Paese</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-zinc-100">{countryCode}</span>
                <span className="text-xs text-zinc-400 font-mono">{countryInfo?.name || "Sconosciuto"}</span>
              </div>
            </div>

            {/* Check Digits */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">Cifre di Controllo</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{checkDigits || "--"}</span>
            </div>

            {/* Italian CIN */}
            {isItalian && (
              <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">CIN Nazionale</span>
                <span className="text-sm font-bold font-mono text-indigo-400">{cin}</span>
              </div>
            )}

            {/* Italian ABI / Bank */}
            {isItalian && (
              <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Codice ABI (Banca)</span>
                <span className="text-sm font-bold font-mono text-amber-400">{abi}</span>
                {bankName && <span className="text-[10px] text-zinc-400 block truncate">{bankName}</span>}
              </div>
            )}

            {/* Italian CAB */}
            {isItalian && (
              <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Codice CAB (Filiale)</span>
                <span className="text-sm font-bold font-mono text-cyan-400">{cab}</span>
              </div>
            )}

            {/* Account Number */}
            <div className="p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg space-y-1 sm:col-span-2">
              <span className="text-[10px] text-zinc-500 font-mono block uppercase">Numero di Conto Corrente</span>
              <span className="text-sm font-bold font-mono text-zinc-200 tracking-wider truncate block">
                {accountNumber || "--"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Notice */}
      <div className="p-3.5 bg-zinc-950/20 border border-zinc-850 rounded-lg flex items-start gap-2.5 text-xs font-mono text-zinc-400">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p>
          Il controllo di validità IBAN utilizza l'algoritmo matematico ufficiale MOD-97 secondo lo standard internazionale ISO 13616. Nessun dato inserito viene salvato o inviato a server esterni.
        </p>
      </div>
    </div>
  );
}
