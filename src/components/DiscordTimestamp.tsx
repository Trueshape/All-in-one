import React, { useState, useEffect } from "react";
import { Clock, Info, Copy, Check, MessageSquare } from "lucide-react";

interface TimestampStyle {
  code: string;
  label: string;
  exampleTemplate: (date: Date) => string;
}

export default function DiscordTimestamp() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Markdown formatting state
  const [markupInput, setMarkupInput] = useState<string>("");
  const [formattedOutput, setFormattedOutput] = useState<string>("");

  useEffect(() => {
    // Default to current date and time
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setSelectedTime(`${hh}:${min}`);
  }, []);

  const getUnixTimestamp = (): number => {
    if (!selectedDate || !selectedTime) return Math.floor(Date.now() / 1000);
    const dateObj = new Date(`${selectedDate}T${selectedTime}`);
    return isNaN(dateObj.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(dateObj.getTime() / 1000);
  };

  const unixSeconds = getUnixTimestamp();

  const styles: TimestampStyle[] = [
    {
      code: "t",
      label: "Ora breve",
      exampleTemplate: (d) =>
        d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    },
    {
      code: "T",
      label: "Ora estesa",
      exampleTemplate: (d) =>
        d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    },
    {
      code: "d",
      label: "Data breve",
      exampleTemplate: (d) =>
        d.toLocaleDateString("it-IT"),
    },
    {
      code: "D",
      label: "Data estesa",
      exampleTemplate: (d) =>
        d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }),
    },
    {
      code: "f",
      label: "Data & Ora breve",
      exampleTemplate: (d) =>
        `${d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })} ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
    },
    {
      code: "F",
      label: "Data & Ora estesa",
      exampleTemplate: (d) =>
        d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    },
    {
      code: "R",
      label: "Tempo relativo",
      exampleTemplate: (d) => {
        const diffMs = d.getTime() - Date.now();
        const diffMins = Math.round(diffMs / 60000);
        if (Math.abs(diffMins) < 1) return "ora";
        if (diffMins > 0) {
          if (diffMins < 60) return `tra ${diffMins} minuti`;
          const diffHours = Math.round(diffMins / 60);
          if (diffHours < 24) return `tra ${diffHours} ore`;
          return `tra ${Math.round(diffHours / 24)} giorni`;
        } else {
          const absMins = Math.abs(diffMins);
          if (absMins < 60) return `${absMins} minuti fa`;
          const absHours = Math.round(absMins / 60);
          if (absHours < 24) return `${absHours} ore fa`;
          return `${Math.round(absHours / 24)} giorni fa`;
        }
      },
    },
  ];

  const handleCopy = (codeString: string) => {
    navigator.clipboard.writeText(codeString);
    setCopiedCode(codeString);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyMarkup = (type: "superscript" | "spoiler" | "bold" | "italic" | "code" | "silent_url" | "header") => {
    if (!markupInput) return;

    let result = "";
    switch (type) {
      case "superscript":
        result = `^(${markupInput})`;
        break;
      case "spoiler":
        result = `||${markupInput}||`;
        break;
      case "bold":
        result = `**${markupInput}**`;
        break;
      case "italic":
        result = `*${markupInput}*`;
        break;
      case "code":
        result = `\`${markupInput}\``;
        break;
      case "silent_url":
        result = `<${markupInput}>`;
        break;
      case "header":
        result = `# ${markupInput}`;
        break;
    }
    setFormattedOutput(result);
  };

  const activeDateObj = new Date(unixSeconds * 1000);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timestamp Selector */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
            Configura Data e Ora
          </span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Ora</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Unix Timestamp (secondi):</span>
              <span className="text-indigo-400 font-bold">{unixSeconds}</span>
            </div>
          </div>

          {/* Table list of codes */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Codici Timestamp Generati (Clicca per Copiare)
            </span>

            <div className="border border-zinc-850 rounded overflow-hidden divide-y divide-zinc-900">
              {styles.map((style) => {
                const tag = `<t:${unixSeconds}:${style.code}>`;
                const isCopied = copiedCode === tag;

                return (
                  <div
                    key={style.code}
                    onClick={() => handleCopy(tag)}
                    className="flex justify-between items-center p-2.5 bg-zinc-950/10 hover:bg-zinc-950/40 cursor-pointer transition-all group"
                  >
                    <div className="font-mono">
                      <span className="text-xs font-bold text-zinc-200 block group-hover:text-indigo-400 transition-colors">
                        {style.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">{tag}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-1.5 py-0.5 rounded">
                        Anteprima: {style.exampleTemplate(activeDateObj)}
                      </span>
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Discord Formatting Utility */}
        <div className="bg-zinc-950/20 border border-zinc-800 rounded p-5 flex flex-col justify-between min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Discord Markdown & Apice Generator
              </span>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Inserisci Testo</label>
              <textarea
                value={markupInput}
                onChange={(e) => setMarkupInput(e.target.value)}
                placeholder="Scrivi qui il testo che vuoi formattare..."
                className="w-full h-24 bg-zinc-950/40 border border-zinc-800 rounded p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyMarkup("superscript")}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono rounded text-zinc-350"
              >
                Apice / Superscript ^{(`text`)}
              </button>
              <button
                onClick={() => applyMarkup("spoiler")}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono rounded text-zinc-350"
              >
                Spoiler ||spoiler||
              </button>
              <button
                onClick={() => applyMarkup("bold")}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono rounded text-zinc-350"
              >
                Grassetto **bold**
              </button>
              <button
                onClick={() => applyMarkup("silent_url")}
                className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono rounded text-zinc-350"
              >
                URL Silenzioso &lt;link&gt;
              </button>
            </div>

            {formattedOutput && (
              <div className="p-3 bg-zinc-950/60 border border-indigo-950 rounded-lg relative">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                  Output Formattato Copiabile
                </span>
                <p className="text-xs font-mono text-zinc-200 break-all pr-8 select-all">
                  {formattedOutput}
                </p>
                <button
                  onClick={() => handleCopy(formattedOutput)}
                  className="absolute right-3.5 bottom-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Copia Output"
                >
                  {copiedCode === formattedOutput ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
            Fai clic su qualsiasi riga o pulsante per copiare istantaneamente il markup negli appunti del sistema.
          </div>
        </div>
      </div>

      <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded flex gap-2.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          Discord analizza i timestamp Unix dinamici visualizzando la data e l'ora adattate al fuso orario locale del rispettivo destinatario del messaggio. L'apice renderizza il testo in formato micro per elenchi o note.
        </p>
      </div>
    </div>
  );
}
