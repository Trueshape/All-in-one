import React, { useState } from "react";
import { Search, RefreshCw, AlertCircle, FileText, CheckCircle2, User, Calendar, MapPin, Check, Copy } from "lucide-react";

// Dati dei comuni principali italiani con codice Belfiore per la decodifica
const BELFIORE_MAP: Record<string, string> = {
  "H501": "Roma (RM)",
  "F205": "Milano (MI)",
  "F839": "Napoli (NA)",
  "L219": "Torino (TO)",
  "G273": "Palermo (PA)",
  "D969": "Genova (GE)",
  "A944": "Bologna (BO)",
  "D612": "Firenze (FI)",
  "A662": "Bari (BA)",
  "C351": "Catania (CT)",
  "L736": "Venezia (VE)",
  "L781": "Verona (VR)",
  "F158": "Messina (ME)",
  "G224": "Padova (PD)",
  "L424": "Trieste (TS)",
  "L049": "Taranto (TA)",
  "B157": "Brescia (BS)",
  "G337": "Parma (PR)",
  "G999": "Prato (PO)",
  "F257": "Modena (MO)",
  "H224": "Reggio Calabria (RC)",
  "H223": "Reggio Emilia (RE)",
  "G478": "Perugia (PG)",
  "H199": "Ravenna (RA)",
  "E625": "Livorno (LI)",
  "B354": "Cagliari (CA)",
  "D643": "Foggia (FG)",
  "H294": "Rimini (RN)",
  "H703": "Salerno (SA)",
  "D548": "Ferrara (FE)",
  "I452": "Sassari (SS)",
  "E472": "Latina (LT)",
  "F704": "Monza (MB)",
  "I754": "Siracusa (SR)",
  "G482": "Pescara (PE)",
  "A794": "Bergamo (BG)",
  "D704": "Forlì (FC)",
  "L378": "Trento (TN)",
  "L840": "Vicenza (VI)",
  "L117": "Terni (TR)",
  "F952": "Novara (NO)",
  "A952": "Bolzano (BZ)",
  "G535": "Piacenza (PC)",
  "A271": "Ancona (AN)",
  "A390": "Arezzo (AR)",
  "L483": "Udine (UD)",
  "C137": "Cesena (FC)",
  "E413": "Lecce (LE)",
};

const MONTH_MAP_REVERSE: Record<string, string> = {
  "A": "Gennaio", "B": "Febbraio", "C": "Marzo", "D": "Aprile", "E": "Maggio", "H": "Giugno",
  "L": "Luglio", "M": "Agosto", "P": "Settembre", "R": "Ottobre", "S": "Novembre", "T": "Dicembre"
};

// Mappa omocodia
const OMOCODIA_DECODE: Record<string, string> = {
  'L': '0', 'M': '1', 'N': '2', 'P': '3', 'Q': '4',
  'R': '5', 'S': '6', 'T': '7', 'U': '8', 'V': '9'
};

const ODD_VALUES: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const EVEN_VALUES: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

export default function CodiceFiscaleInverse({ hideHeader = false }: { hideHeader?: boolean }) {
  const [cfInput, setCfInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    cf: string;
    sesso: "Maschio" | "Femmina";
    giornoNascita: number;
    meseNascita: string;
    annoNascitaCompleto: string;
    luogoNascita: string;
    belfioreCode: string;
    checksumCorrect: boolean;
    checksumCalcolato: string;
    checksumInserito: string;
    cognomeSillaba: string;
    nomeSillaba: string;
  } | null>(null);

  const resolveOmocodiaChar = (char: string): string => {
    const upper = char.toUpperCase();
    return OMOCODIA_DECODE[upper] !== undefined ? OMOCODIA_DECODE[upper] : char;
  };

  const resolveStringOmocodia = (part: string): string => {
    return part.split("").map(resolveOmocodiaChar).join("");
  };

  const verifyChecksum = (code: string): { matches: boolean; calculated: string } => {
    const partial = code.slice(0, 15).toUpperCase();
    const inserted = code[15].toUpperCase();
    
    let sum = 0;
    for (let i = 0; i < partial.length; i++) {
      const char = partial[i];
      const position = i + 1;
      
      if (position % 2 !== 0) {
        sum += ODD_VALUES[char] !== undefined ? ODD_VALUES[char] : 0;
      } else {
        sum += EVEN_VALUES[char] !== undefined ? EVEN_VALUES[char] : 0;
      }
    }
    
    const remainder = sum % 26;
    const calculated = String.fromCharCode(65 + remainder);
    return {
      matches: calculated === inserted,
      calculated
    };
  };

  const handleDecode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDetails(null);

    const cf = cfInput.trim().toUpperCase();
    
    if (cf.length !== 16) {
      setError("Il Codice Fiscale deve essere di esattamente 16 caratteri.");
      return;
    }

    // Regola generale del Codice Fiscale (permette lettere dell'omocodia)
    const cfRegex = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;
    if (!cfRegex.test(cf)) {
      setError("Il formato del Codice Fiscale inserito non è valido.");
      return;
    }

    try {
      // Estrai anno di nascita
      const rawYear = cf.slice(6, 8);
      const decodedYear = resolveStringOmocodia(rawYear);
      const yearNum = parseInt(decodedYear, 10);
      
      // Decidi secolo d'appartenenza (se <= 26, assumiamo 2000, altrimenti 1900)
      const currentYearShort = new Date().getFullYear() % 100;
      const fullYear = yearNum <= currentYearShort ? `20${decodedYear}` : `19${decodedYear}`;

      // Estrai mese di nascita
      const monthChar = cf[8];
      const monthName = MONTH_MAP_REVERSE[monthChar];
      if (!monthName) {
        setError(`Mese di nascita non valido nel codice fiscale (carattere '${monthChar}').`);
        return;
      }

      // Estrai giorno e sesso
      const rawDay = cf.slice(9, 11);
      const decodedDay = resolveStringOmocodia(rawDay);
      let dayNum = parseInt(decodedDay, 10);
      
      let sesso: "Maschio" | "Femmina" = "Maschio";
      if (dayNum > 40) {
        sesso = "Femmina";
        dayNum -= 40;
      }

      if (dayNum < 1 || dayNum > 31) {
        setError(`Giorno di nascita non valido nel codice fiscale (${dayNum}).`);
        return;
      }

      // Estrai comune di nascita (Codice Belfiore)
      const firstBelfioreChar = cf[11];
      const lastThreeBelfioreChars = cf.slice(12, 15);
      const decodedBelfioreDigits = resolveStringOmocodia(lastThreeBelfioreChars);
      const belfioreCode = `${firstBelfioreChar}${decodedBelfioreDigits}`;
      
      const luogoNascita = BELFIORE_MAP[belfioreCode] || `Comune con codice Belfiore "${belfioreCode}"`;

      // Verifica codice di controllo
      const { matches, calculated } = verifyChecksum(cf);

      // Estrai cognome (primi 3 caratteri)
      const cognomeSillaba = cf.slice(0, 3);
      // Estrai nome (secondi 3 caratteri)
      const nomeSillaba = cf.slice(3, 6);

      setDetails({
        cf,
        sesso,
        giornoNascita: dayNum,
        meseNascita: monthName,
        annoNascitaCompleto: fullYear,
        luogoNascita,
        belfioreCode,
        checksumCorrect: matches,
        checksumCalcolato: calculated,
        checksumInserito: cf[15],
        cognomeSillaba,
        nomeSillaba,
      });
    } catch (err) {
      setError("Impossibile decodificare il codice fiscale. Verifica la correttezza del testo.");
    }
  };

  const handleCopy = () => {
    if (!details) return;
    navigator.clipboard.writeText(details.cf);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCfInput("");
    setDetails(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Codice Fiscale Inverso</h3>
        </div>
      )}

      <form onSubmit={handleDecode} className="space-y-4">
        <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-3 focus-within:border-zinc-700 transition-all">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
            Inserisci il Codice Fiscale (16 Caratteri)
          </label>
          <input
            type="text"
            maxLength={16}
            value={cfInput}
            onChange={(e) => setCfInput(e.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder="es. RSSMRA80A01H501U"
            className="w-full bg-transparent border-none p-0 text-base font-mono text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-0 tracking-widest uppercase font-bold"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-mono text-xs font-semibold py-3 px-4 rounded transition-all shadow-lg shadow-indigo-950/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            Decodifica Codice Fiscale
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-3 border border-zinc-850 hover:bg-zinc-900 rounded font-mono text-xs text-zinc-400 transition-all flex items-center justify-center cursor-pointer"
            title="Svuota"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs font-mono text-red-400">{error}</span>
        </div>
      )}

      {/* Decoded Details */}
      {details && (
        <div className="space-y-4 pt-4 border-t border-zinc-900 animate-fade-in">
          {/* Checksum Status Header */}
          <div className={`border rounded p-4 flex items-center gap-3.5 ${
            details.checksumCorrect
              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
              : "bg-amber-500/5 border-amber-500/10 text-amber-400"
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="font-mono text-xs">
              <p className="font-bold">
                {details.checksumCorrect
                  ? "Sintassi e Carattere di Controllo Validi!"
                  : "Attenzione: Carattere di Controllo Incoerente!"}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Codice inserito: <strong className="text-zinc-300">{details.cf}</strong>.
                {details.checksumCorrect ? (
                  ` Il codice di controllo è corretto (${details.checksumInserito}).`
                ) : (
                  ` Dovrebbe finire con '${details.checksumCalcolato}' anziché '${details.checksumInserito}'.`
                )}
              </p>
            </div>
          </div>

          {/* Extracted Data Bento-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Gender */}
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex items-center gap-3.5">
              <User className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Sesso</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">{details.sesso}</span>
              </div>
            </div>

            {/* Birthday */}
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex items-center gap-3.5 sm:col-span-1">
              <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Data di Nascita</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {details.giornoNascita} {details.meseNascita} {details.annoNascitaCompleto}
                </span>
              </div>
            </div>

            {/* Birth Place */}
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex items-center gap-3.5">
              <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider mb-0.5">Comune di Nascita</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">{details.luogoNascita}</span>
              </div>
            </div>
          </div>

          {/* Extracted Surname and Name (Sillabe) Section */}
          <div className="bg-zinc-950/30 border border-zinc-800 rounded p-4 space-y-4">
            <div className="border-b border-zinc-850 pb-2 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider">
                Analisi Nome e Cognome (Primi 6 caratteri)
              </span>
            </div>

            <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
              Il Codice Fiscale non memorizza nome e cognome completi per esteso, ma li comprime in due codici di 3 lettere ciascuno (sillabe composte da consonanti e vocali):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950/40 border border-zinc-850 rounded p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Cognome (Caratteri 1-3)</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold tracking-widest">{details.cognomeSillaba}</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono leading-normal">
                  Derivato dalle prime <span className="text-indigo-300">3 consonanti</span> del cognome. Esempio: Ro<span className="text-indigo-400 font-bold">ss</span>i &rarr; <span className="text-indigo-400 font-bold">RSS</span> (oppure con vocali se mancano, es. M<span className="text-indigo-400 font-bold">a</span><span className="text-indigo-400 font-bold">r</span>i &rarr; <span className="text-indigo-400 font-bold">MRA</span>). Completato con X se il cognome ha meno di 3 lettere.
                </p>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-850 rounded p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Nome (Caratteri 4-6)</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold tracking-widest">{details.nomeSillaba}</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono leading-normal">
                  Derivato dalla <span className="text-indigo-300">1ª, 3ª e 4ª consonante</span> del nome se ce ne sono almeno 4 (es. M<span className="text-indigo-400 font-bold">a</span><span className="text-indigo-400 font-bold">r</span>i<span className="text-indigo-400 font-bold">o</span> &rarr; <span className="text-indigo-400 font-bold">MRA</span>). Altrimenti le prime consonanti e vocali in ordine.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Copy Info */}
          <div className="bg-zinc-950/50 border border-zinc-850 rounded p-3 flex justify-between items-center px-4">
            <span className="text-xs font-mono text-zinc-500">Copia il codice decodificato</span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-250 hover:bg-zinc-850"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiato
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copia
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
