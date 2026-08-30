import { useState } from "react";
import { AlignLeft, Copy, Check, Trash2, ArrowUpAZ, Sparkles } from "lucide-react";

export default function TextCounter() {
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Statistics
  const charCountWithSpaces = text.length;
  const charCountNoSpaces = text.replace(/\s/g, "").length;
  
  const words = text.trim() ? text.trim().split(/\s+/) : [];
  const wordCount = words.length;

  const lines = text.trim() ? text.split("\n") : [];
  const lineCount = lines.length;

  const sentences = text.trim() ? text.split(/[.!?]+/).filter(Boolean) : [];
  const sentenceCount = sentences.length;

  // Reading time (average 200 words per minute)
  const readingTimeSeconds = Math.ceil((wordCount / 200) * 60);
  const readingTime = readingTimeSeconds < 60 
    ? `${readingTimeSeconds} sec` 
    : `${Math.ceil(readingTimeSeconds / 60)} min`;

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUppercase = () => {
    setText(text.toUpperCase());
  };

  const handleLowercase = () => {
    setText(text.toLowerCase());
  };

  const handleSentenceCase = () => {
    // Split into sentences, capitalize first letter of each sentence
    const capitalized = text
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+)([a-z\u00E0-\u00FC])/g, (m) => m.toUpperCase());
    setText(capitalized);
  };

  const handleReverse = () => {
    setText(text.split("").reverse().join(""));
  };

  return (
    <div className="space-y-6">
      {/* Editor Controls */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlignLeft className="w-3.5 h-3.5 text-indigo-400" /> Editor di Testo
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setText("")}
            disabled={!text}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Cancella Tutto"
            id="btn-text-clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Copia Testo"
            id="btn-text-copy"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-sans text-sm transition-all resize-y"
          placeholder="Scrivi o incolla qui il tuo testo per contare le parole e analizzarlo..."
          id="textarea-counter"
        />
      </div>

      {/* Transformations buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={handleUppercase}
          disabled={!text}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:border-zinc-800 transition-colors text-zinc-300 font-medium text-xs rounded-lg"
          id="btn-text-upper"
        >
          MAIUSCOLO
        </button>
        <button
          onClick={handleLowercase}
          disabled={!text}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:border-zinc-800 transition-colors text-zinc-300 font-medium text-xs rounded-lg"
          id="btn-text-lower"
        >
          minuscolo
        </button>
        <button
          onClick={handleSentenceCase}
          disabled={!text}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:border-zinc-800 transition-colors text-zinc-300 font-medium text-xs rounded-lg"
          id="btn-text-sentence"
        >
          Capitalizza Frasi
        </button>
        <button
          onClick={handleReverse}
          disabled={!text}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:border-zinc-800 transition-colors text-zinc-300 font-medium text-xs rounded-lg"
          id="btn-text-reverse"
        >
          Inverti Specchio
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Parole</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1">{wordCount}</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Caratteri (Spazi Inc.)</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1">{charCountWithSpaces}</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Caratteri (Senza Spazi)</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1">{charCountNoSpaces}</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Frasi</span>
          <span className="text-xl font-bold font-mono text-zinc-300 mt-1">{sentenceCount}</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Righe</span>
          <span className="text-xl font-bold font-mono text-zinc-300 mt-1">{lineCount}</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 justify-center">
            <Sparkles className="w-3 h-3 text-amber-400" /> Lettura Stimata
          </span>
          <span className="text-lg font-bold text-amber-400 mt-1">{readingTime}</span>
        </div>
      </div>
    </div>
  );
}
