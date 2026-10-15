import React, { useState } from "react";
import { Check, Copy, Fingerprint, RefreshCw, AlertCircle, HelpCircle, Search } from "lucide-react";
import CodiceFiscaleInverse from "./CodiceFiscaleInverse";

// Dati dei comuni principali italiani con codice Belfiore
const MAJOR_COMUNI = [
  { name: "Roma (RM)", code: "H501" },
  { name: "Milano (MI)", code: "F205" },
  { name: "Napoli (NA)", code: "F839" },
  { name: "Torino (TO)", code: "L219" },
  { name: "Palermo (PA)", code: "G273" },
  { name: "Genova (GE)", code: "D969" },
  { name: "Bologna (BO)", code: "A944" },
  { name: "Firenze (FI)", code: "D612" },
  { name: "Bari (BA)", code: "A662" },
  { name: "Catania (CT)", code: "C351" },
  { name: "Venezia (VE)", code: "L736" },
  { name: "Verona (VR)", code: "L781" },
  { name: "Messina (ME)", code: "F158" },
  { name: "Padova (PD)", code: "G224" },
  { name: "Trieste (TS)", code: "L424" },
  { name: "Taranto (TA)", code: "L049" },
  { name: "Brescia (BS)", code: "B157" },
  { name: "Parma (PR)", code: "G337" },
  { name: "Prato (PO)", code: "G999" },
  { name: "Modena (MO)", code: "F257" },
  { name: "Reggio Calabria (RC)", code: "H224" },
  { name: "Reggio Emilia (RE)", code: "H223" },
  { name: "Perugia (PG)", code: "G478" },
  { name: "Ravenna (RA)", code: "H199" },
  { name: "Livorno (LI)", code: "E625" },
  { name: "Cagliari (CA)", code: "B354" },
  { name: "Foggia (FG)", code: "D643" },
  { name: "Rimini (RN)", code: "H294" },
  { name: "Salerno (SA)", code: "H703" },
  { name: "Ferrara (FE)", code: "D548" },
  { name: "Sassari (SS)", code: "I452" },
  { name: "Latina (LT)", code: "E472" },
  { name: "Monza (MB)", code: "F704" },
  { name: "Siracusa (SR)", code: "I754" },
  { name: "Pescara (PE)", code: "G482" },
  { name: "Bergamo (BG)", code: "A794" },
  { name: "Forlì (FC)", code: "D704" },
  { name: "Trento (TN)", code: "L378" },
  { name: "Vicenza (VI)", code: "L840" },
  { name: "Terni (TR)", code: "L117" },
  { name: "Novara (NO)", code: "F952" },
  { name: "Bolzano (BZ)", code: "A952" },
  { name: "Piacenza (PC)", code: "G535" },
  { name: "Ancona (AN)", code: "A271" },
  { name: "Arezzo (AR)", code: "A390" },
  { name: "Udine (UD)", code: "L483" },
  { name: "Cesena (FC)", code: "C137" },
  { name: "Lecce (LE)", code: "E413" },
].sort((a, b) => a.name.localeCompare(b.name));

const MONTH_CODES: Record<number, string> = {
  1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "H",
  7: "L", 8: "M", 9: "P", 10: "R", 11: "S", 12: "T"
};

// Algoritmo Codice di Controllo (caratteri in posizione dispari)
const ODD_VALUES: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

// Algoritmo Codice di Controllo (caratteri in posizione pari)
const EVEN_VALUES: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

export default function CodiceFiscaleCalculator() {
  const [activeTab, setActiveTab] = useState<"calc" | "inv">("calc");
  const [cognome, setCognome] = useState("");
  const [nome, setNome] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [sesso, setSesso] = useState<"M" | "F">("M");
  const [comuneType, setComuneType] = useState<"major" | "custom">("major");
  const [selectedComune, setSelectedComune] = useState(MAJOR_COMUNI[0].code);
  const [customBelfiore, setCustomBelfiore] = useState("");
  
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [breakdown, setBreakdown] = useState<{
    cognomePart: string;
    nomePart: string;
    dataSessoPart: string;
    belfiorePart: string;
    controlChar: string;
  } | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  const cleanString = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // rimuove accenti
      .toUpperCase()
      .replace(/[^A-Z]/g, ""); // tiene solo lettere
  };

  const getConsonantsAndVowels = (str: string) => {
    const consonants = str.replace(/[AEIOU]/g, "");
    const vowels = str.replace(/[^AEIOU]/g, "");
    return { consonants, vowels };
  };

  const calculateCognomeCode = (str: string): string => {
    const cleaned = cleanString(str);
    const { consonants, vowels } = getConsonantsAndVowels(cleaned);
    
    let code = consonants;
    if (code.length < 3) {
      code += vowels;
    }
    if (code.length < 3) {
      code += "X".repeat(3 - code.length);
    }
    return code.substring(0, 3);
  };

  const calculateNomeCode = (str: string): string => {
    const cleaned = cleanString(str);
    const { consonants, vowels } = getConsonantsAndVowels(cleaned);
    
    let code = "";
    if (consonants.length >= 4) {
      // Regola del nome: se ci sono almeno 4 consonanti, prendi la prima, la terza e la quarta
      code = consonants[0] + consonants[2] + consonants[3];
    } else {
      code = consonants;
      if (code.length < 3) {
        code += vowels;
      }
      if (code.length < 3) {
        code += "X".repeat(3 - code.length);
      }
      code = code.substring(0, 3);
    }
    return code;
  };

  const calculateDateAndGenderCode = (dateStr: string, gender: "M" | "F"): string => {
    if (!dateStr) return "00A00";
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear().toString().slice(-2);
    const month = dateObj.getMonth() + 1;
    const monthChar = MONTH_CODES[month] || "A";
    
    let day = dateObj.getDate();
    if (gender === "F") {
      day += 40;
    }
    
    const dayStr = day.toString().padStart(2, "0");
    return `${year}${monthChar}${dayStr}`;
  };

  const computeControlChar = (partialCode: string): string => {
    let sum = 0;
    for (let i = 0; i < partialCode.length; i++) {
      const char = partialCode[i];
      const position = i + 1; // 1-indexed
      
      if (position % 2 !== 0) {
        // Posizione dispari
        sum += ODD_VALUES[char] !== undefined ? ODD_VALUES[char] : 0;
      } else {
        // Posizione pari
        sum += EVEN_VALUES[char] !== undefined ? EVEN_VALUES[char] : 0;
      }
    }
    
    const remainder = sum % 26;
    return String.fromCharCode(65 + remainder); // 65 è 'A' in ASCII
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBreakdown(null);

    if (!cognome.trim()) {
      setError("Inserisci il cognome.");
      return;
    }
    if (!nome.trim()) {
      setError("Inserisci il nome.");
      return;
    }
    if (!dataNascita) {
      setError("Seleziona la data di nascita.");
      return;
    }

    const belfiore = comuneType === "major" ? selectedComune : customBelfiore.trim().toUpperCase();
    if (!belfiore || belfiore.length !== 4 || !/^[A-Z][0-9]{3}$/.test(belfiore)) {
      setError("Codice Belfiore del comune non valido. Deve essere composto da una lettera e 3 cifre (es. H501).");
      return;
    }

    try {
      const cognomePart = calculateCognomeCode(cognome);
      const nomePart = calculateNomeCode(nome);
      const dataSessoPart = calculateDateAndGenderCode(dataNascita, sesso);
      const belfiorePart = belfiore;
      
      const partialCode = `${cognomePart}${nomePart}${dataSessoPart}${belfiorePart}`;
      const controlChar = computeControlChar(partialCode);
      
      const fullCode = `${partialCode}${controlChar}`;
      
      setResult(fullCode);
      setBreakdown({
        cognomePart,
        nomePart,
        dataSessoPart,
        belfiorePart,
        controlChar,
      });
    } catch (err) {
      setError("Si è verificato un errore durante il calcolo. Verifica i dati inseriti.");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCognome("");
    setNome("");
    setDataNascita("");
    setSesso("M");
    setComuneType("major");
    setSelectedComune(MAJOR_COMUNI[0].code);
    setCustomBelfiore("");
    setResult(null);
    setBreakdown(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Fingerprint className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Calcolo Codice Fiscale</h3>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-zinc-950/40 p-1 rounded border border-zinc-850/80">
        <button
          type="button"
          onClick={() => setActiveTab("calc")}
          className={`flex-1 py-1.5 text-xs font-mono rounded transition-all cursor-pointer text-center ${
            activeTab === "calc"
              ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-bold"
              : "text-zinc-500 hover:text-zinc-300 border border-transparent"
          }`}
        >
          Calcola
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("inv")}
          className={`flex-1 py-1.5 text-xs font-mono rounded transition-all cursor-pointer text-center ${
            activeTab === "inv"
              ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-bold"
              : "text-zinc-500 hover:text-zinc-300 border border-transparent"
          }`}
        >
          Decodifica Inversa (Decoder)
        </button>
      </div>

      {activeTab === "inv" ? (
        <CodiceFiscaleInverse hideHeader />
      ) : (
        <>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cognome */}
              <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 focus-within:border-zinc-700 transition-all">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Cognome
                </label>
                <input
                  type="text"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  placeholder="es. Rossi"
                  className="w-full bg-transparent border-none p-0 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-0 placeholder:text-zinc-600"
                />
              </div>

              {/* Nome */}
              <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 focus-within:border-zinc-700 transition-all">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="es. Mario"
                  className="w-full bg-transparent border-none p-0 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-0 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data di Nascita */}
              <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 focus-within:border-zinc-700 transition-all">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Data di Nascita
                </label>
                <input
                  type="date"
                  value={dataNascita}
                  onChange={(e) => setDataNascita(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-0"
                />
              </div>

              {/* Sesso */}
              <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 flex flex-col justify-between">
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Sesso
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-zinc-300">
                    <input
                      type="radio"
                      name="sesso"
                      checked={sesso === "M"}
                      onChange={() => setSesso("M")}
                      className="accent-indigo-500 focus:ring-0 bg-transparent"
                    />
                    Maschio (M)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-zinc-300">
                    <input
                      type="radio"
                      name="sesso"
                      checked={sesso === "F"}
                      onChange={() => setSesso("F")}
                      className="accent-indigo-500 focus:ring-0 bg-transparent"
                    />
                    Femmina (F)
                  </label>
                </div>
              </div>
            </div>

            {/* Comune di nascita */}
            <div className="border border-zinc-800 rounded p-4 bg-zinc-950/20 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Comune di Nascita</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setComuneType("major")}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all ${
                      comuneType === "major"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Città Principali
                  </button>
                  <button
                    type="button"
                    onClick={() => setComuneType("custom")}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all ${
                      comuneType === "custom"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold"
                        : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Altro Comune / Estero
                  </button>
                </div>
              </div>

              {comuneType === "major" ? (
                <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2">
                  <select
                    value={selectedComune}
                    onChange={(e) => setSelectedComune(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-0"
                  >
                    {MAJOR_COMUNI.map((c) => (
                      <option key={c.code} value={c.code} className="bg-zinc-900 text-zinc-200">
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2 focus-within:border-zinc-700 transition-all">
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                      Codice Belfiore
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={customBelfiore}
                      onChange={(e) => setCustomBelfiore(e.target.value)}
                      placeholder="es. H501"
                      className="w-full bg-transparent border-none p-0 text-sm font-mono text-zinc-200 focus:outline-none focus:ring-0 placeholder:text-zinc-700"
                    />
                  </div>
                  <div className="flex items-center text-xs text-zinc-500 bg-zinc-950/10 rounded px-3 py-2 border border-zinc-900">
                    <HelpCircle className="w-4 h-4 text-zinc-600 mr-2 shrink-0" />
                    <span>Inserisci il codice catastale a 4 caratteri del comune (es. D612 per Firenze) o dello Stato estero.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-mono text-xs font-semibold py-3 px-4 rounded transition-all shadow-lg shadow-indigo-950/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                Calcola Codice Fiscale
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 border border-zinc-850 hover:bg-zinc-900 rounded font-mono text-xs text-zinc-400 transition-all flex items-center justify-center cursor-pointer"
                title="Svuota campi"
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

          {/* Result Display */}
          {result && breakdown && (
            <div className="space-y-4 pt-4 border-t border-zinc-900 animate-fade-in">
              <div className="bg-zinc-950/40 border border-zinc-800 rounded p-5 text-center relative overflow-hidden group">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">Il tuo Codice Fiscale</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider text-zinc-100 select-all">
                    {result}
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      copied
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-850"
                    }`}
                    title="Copia codice fiscale"
                  >
                    {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {/* Breakdown Explanation */}
              <div className="bg-zinc-950/15 border border-zinc-850 rounded p-4.5 space-y-3">
                <h4 className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
                  Dettaglio di Composizione:
                </h4>
                
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-baseline py-1 border-b border-zinc-900/40">
                    <span className="text-zinc-500">Cognome ({cognome}):</span>
                    <span className="text-indigo-450 font-bold">{breakdown.cognomePart}</span>
                  </div>
                  <div className="flex justify-between items-baseline py-1 border-b border-zinc-900/40">
                    <span className="text-zinc-500">Nome ({nome}):</span>
                    <span className="text-indigo-450 font-bold">{breakdown.nomePart}</span>
                  </div>
                  <div className="flex justify-between items-baseline py-1 border-b border-zinc-900/40">
                    <span className="text-zinc-500">Anno, Mese, Giorno e Sesso:</span>
                    <span className="text-indigo-450 font-bold">{breakdown.dataSessoPart}</span>
                  </div>
                  <div className="flex justify-between items-baseline py-1 border-b border-zinc-900/40">
                    <span className="text-zinc-500">Codice Comune/Stato Belfiore:</span>
                    <span className="text-indigo-450 font-bold">{breakdown.belfiorePart}</span>
                  </div>
                  <div className="flex justify-between items-baseline py-1">
                    <span className="text-zinc-500">Carattere di controllo:</span>
                    <span className="text-emerald-400 font-bold">{breakdown.controlChar}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
