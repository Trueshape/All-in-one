import React, { useState } from "react";
import { GitCompare, Info, Trash2, ArrowRight } from "lucide-react";

interface DiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumber?: number;
}

export default function TextDiff() {
  const [textA, setTextA] = useState<string>("");
  const [textB, setTextB] = useState<string>("");

  const clearAll = () => {
    setTextA("");
    setTextB("");
  };

  const loadSample = () => {
    setTextA(
      "DailySphere è una raccolta di utilità web.\nInclude diversi calcolatori e convertitori.\nDisponibile su tutti i dispositivi.\nCreato in React e Tailwind CSS."
    );
    setTextB(
      "DailySphere è la migliore suite di utilità web!\nInclude diversi calcolatori, convertitori e strumenti di sviluppo.\nDisponibile su tutti i dispositivi mobili e desktop.\nCreato in React, TypeScript e Tailwind CSS."
    );
  };

  // Simple line-by-line diff engine using LCS (longest common subsequence) or clean alignment
  const computeDiff = (): DiffLine[] => {
    const linesA = textA.split("\n");
    const linesB = textB.split("\n");

    const diff: DiffLine[] = [];
    let i = 0;
    let j = 0;

    while (i < linesA.length || j < linesB.length) {
      if (i < linesA.length && j < linesB.length) {
        if (linesA[i] === linesB[j]) {
          diff.push({ type: "unchanged", text: linesA[i], lineNumber: i + 1 });
          i++;
          j++;
        } else {
          // Check if linesA[i] is completely deleted or linesB[j] is inserted
          // Lookahead to find matching lines
          let matchIndexB = -1;
          for (let k = j; k < linesB.length; k++) {
            if (linesB[k] === linesA[i]) {
              matchIndexB = k;
              break;
            }
          }

          if (matchIndexB !== -1) {
            // Lines in linesB between j and matchIndexB are added lines
            for (let k = j; k < matchIndexB; k++) {
              diff.push({ type: "added", text: linesB[k] });
            }
            j = matchIndexB;
          } else {
            // LinesA[i] is removed
            diff.push({ type: "removed", text: linesA[i] });
            i++;
          }
        }
      } else if (i < linesA.length) {
        // Remaining lines in A are deleted
        diff.push({ type: "removed", text: linesA[i] });
        i++;
      } else if (j < linesB.length) {
        // Remaining lines in B are added
        diff.push({ type: "added", text: linesB[j] });
        j++;
      }
    }

    return diff;
  };

  const diffOutput = computeDiff();

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex justify-between items-center bg-zinc-950/20 p-2.5 border border-zinc-800/60 rounded">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Modulo di Confronto Testi
        </span>
        <div className="flex gap-2">
          <button
            onClick={loadSample}
            className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2.5 py-1 rounded hover:bg-zinc-900 transition-all"
          >
            Carica Esempio
          </button>
          {(textA || textB) && (
            <button
              onClick={clearAll}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-950/20 border border-zinc-800 hover:border-rose-900/50 text-[10px] font-mono text-zinc-400 hover:text-rose-400 rounded flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Svuota
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">Testo Originale (A)</label>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="Incolla qui la prima versione del testo..."
            className="w-full h-44 bg-zinc-950/40 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
          />
        </div>

        {/* Right Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-zinc-400 block uppercase tracking-wider">Testo Modificato (B)</label>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Incolla qui la nuova versione modificata..."
            className="w-full h-44 bg-zinc-950/40 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Difference Output Viewer */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded p-4 space-y-3">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block border-b border-zinc-850 pb-2">
          Differenze Rilevate (Diff Output)
        </span>

        <div className="rounded border border-zinc-900 bg-zinc-950/80 overflow-hidden font-mono text-[11px] leading-relaxed max-h-[300px] overflow-y-auto">
          {textA === "" && textB === "" ? (
            <div className="p-10 text-center text-zinc-650">
              Inserisci del testo in entrambe le aree sovrastanti per analizzare le differenze riga per riga.
            </div>
          ) : (
            <div className="divide-y divide-zinc-900/40">
              {diffOutput.map((line, idx) => {
                let bgColor = "hover:bg-zinc-900/30 text-zinc-400";
                let prefix = " ";
                if (line.type === "added") {
                  bgColor = "bg-emerald-500/10 text-emerald-400 font-medium px-1";
                  prefix = "+";
                } else if (line.type === "removed") {
                  bgColor = "bg-rose-500/10 text-rose-400 line-through px-1";
                  prefix = "-";
                }

                return (
                  <div key={idx} className={`py-1 px-3 flex gap-4 ${bgColor}`}>
                    <span className="text-zinc-600 select-none w-5 text-right">
                      {line.lineNumber ? line.lineNumber : ""}
                    </span>
                    <span className="text-zinc-650 select-none w-3 font-bold">{prefix}</span>
                    <span className="whitespace-pre-wrap break-all flex-1">{line.text || " "}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded flex gap-2.5 text-xs text-zinc-400">
        <GitCompare className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          La comparazione riga per riga individua i testi aggiunti (<code className="text-emerald-400 font-mono">+</code>) 
          o rimossi (<code className="text-rose-400 font-mono">-</code>) tra due versioni, facilitando la revisione di bozze o righe di codice.
        </p>
      </div>
    </div>
  );
}
