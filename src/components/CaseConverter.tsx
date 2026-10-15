import React, { useState } from "react";
import { Type, Info, Copy, Check, Trash2 } from "lucide-react";

export default function CaseConverter() {
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const charCountNoSpaces = text.replace(/\s+/g, "").length;
  const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
  const lineCount = text.split(/\n/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 WPM average

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toUppercase = () => setText((prev) => prev.toUpperCase());
  const toLowercase = () => setText((prev) => prev.toLowerCase());

  const toTitleCase = () => {
    const title = text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    setText(title);
  };

  const toSentenceCase = () => {
    const sentences = text.split(/([.!?]\s+)/);
    const converted = sentences
      .map((part) => {
        if (/^[.!?]\s+$/.test(part)) return part;
        const trimmed = part.trim();
        if (!trimmed) return part;
        return part.replace(trimmed, trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
      })
      .join("");
    setText(converted);
  };

  const toCamelCase = () => {
    const camel = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "");
    setText(camel.charAt(0).toLowerCase() + camel.slice(1));
  };

  const toSnakeCase = () => {
    const snake = text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    setText(snake);
  };

  const toKebabCase = () => {
    const kebab = text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "");
    setText(kebab);
  };

  const toAlternatingCase = () => {
    const alternated = text
      .split("")
      .map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()))
      .join("");
    setText(alternated);
  };

  const loadSample = () => {
    setText("Converti questo testo di esempio in diversi formati. Analizza anche le statistiche della lettura.");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Input Column - 5 cols width */}
        <div className="md:col-span-5 flex flex-col space-y-2">
          <div className="flex justify-between items-center shrink-0">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Testo</span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadSample}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                Carica Esempio
              </button>
              
              {text && (
                <>
                  <button
                    onClick={handleCopy}
                    className="text-[10px] font-mono flex items-center gap-1 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2 py-1 rounded transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copiato!" : "Copia"}
                  </button>
                  <button
                    onClick={() => setText("")}
                    className="p-1 text-zinc-500 hover:text-rose-450 transition-colors border border-zinc-800 rounded cursor-pointer"
                    title="Pulisci tutto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Scrivi o incolla il tuo testo qui per modificarne la formattazione e visualizzare le statistiche di lettura..."
            className="w-full flex-1 min-h-[300px] md:min-h-full bg-zinc-950/40 border border-zinc-800 rounded p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
          />
        </div>

        {/* Middle Conversion Column - 3 cols width */}
        <div className="md:col-span-3 flex flex-col space-y-2">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block shrink-0">
            Conversione Case
          </span>
          
          <div className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex flex-col justify-center gap-2.5 flex-grow">
            <button
              onClick={toUppercase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              MAIUSCOLO
            </button>
            <button
              onClick={toLowercase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              minuscolo
            </button>
            <button
              onClick={toTitleCase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              Title Case
            </button>
            <button
              onClick={toSentenceCase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              Sentence case
            </button>
            <button
              onClick={toCamelCase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              camelCase
            </button>
            <button
              onClick={toSnakeCase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              snake_case
            </button>
            <button
              onClick={toKebabCase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              kebab-case
            </button>
            <button
              onClick={toAlternatingCase}
              className="w-full px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono rounded text-zinc-350 hover:text-zinc-100 transition-all text-center cursor-pointer"
            >
              AlTeRnAtO
            </button>
          </div>
        </div>

        {/* Right Analytics Column - 4 cols width */}
        <div className="md:col-span-4 flex flex-col space-y-2">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block shrink-0">
            Statistiche Testo
          </span>
          
          <div className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex flex-col justify-between flex-grow">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
                <Type className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  Analisi del Testo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 bg-zinc-900/40 rounded border border-zinc-850/60">
                  <span className="text-[9px] text-zinc-500 block uppercase">Caratteri</span>
                  <span className="text-sm font-bold text-zinc-200">{charCount}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 rounded border border-zinc-850/60">
                  <span className="text-[9px] text-zinc-500 block uppercase">Senza Spazi</span>
                  <span className="text-sm font-bold text-zinc-200">{charCountNoSpaces}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 rounded border border-zinc-850/60">
                  <span className="text-[9px] text-zinc-500 block uppercase">Parole</span>
                  <span className="text-sm font-bold text-zinc-200">{wordCount}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/40 rounded border border-zinc-850/60">
                  <span className="text-[9px] text-zinc-500 block uppercase">Frasi</span>
                  <span className="text-sm font-bold text-zinc-200">{sentenceCount}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-850 space-y-2 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between">
                <span>Righe totali:</span>
                <span className="text-zinc-300 font-bold">{lineCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo lettura stimato:</span>
                <span className="text-zinc-300 font-bold">~ {readingTime} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
