import React, { useState, useEffect } from "react";
import { Info, HelpCircle } from "lucide-react";

export default function CircleCalculator() {
  const [radius, setRadius] = useState<string>("5");
  const [diameter, setDiameter] = useState<string>("10");
  const [circumference, setCircumference] = useState<string>("31.42");
  const [area, setArea] = useState<string>("78.54");
  const [lastUpdated, setLastUpdated] = useState<"r" | "d" | "c" | "a">("r");

  const calculateAll = (val: number, type: "r" | "d" | "c" | "a") => {
    if (isNaN(val) || val <= 0) {
      return;
    }

    let r = 0;
    switch (type) {
      case "r":
        r = val;
        break;
      case "d":
        r = val / 2;
        break;
      case "c":
        r = val / (2 * Math.PI);
        break;
      case "a":
        r = Math.sqrt(val / Math.PI);
        break;
    }

    const computedR = r;
    const computedD = r * 2;
    const computedC = 2 * Math.PI * r;
    const computedA = Math.PI * r * r;

    if (type !== "r") setRadius(String(Number(computedR.toFixed(4))));
    if (type !== "d") setDiameter(String(Number(computedD.toFixed(4))));
    if (type !== "c") setCircumference(String(Number(computedC.toFixed(4))));
    if (type !== "a") setArea(String(Number(computedA.toFixed(4))));
  };

  const handleInputChange = (value: string, type: "r" | "d" | "c" | "a") => {
    switch (type) {
      case "r":
        setRadius(value);
        break;
      case "d":
        setDiameter(value);
        break;
      case "c":
        setCircumference(value);
        break;
      case "a":
        setArea(value);
        break;
    }
    setLastUpdated(type);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      calculateAll(parsed, type);
    }
  };

  const rVal = parseFloat(radius) || 0;
  const normalizedVisualRadius = Math.min(88, Math.max(16, rVal * 8.8));

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Input Parameters Box */}
        <div className="space-y-4.5">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Inserisci un parametro per calcolare gli altri
          </span>

          {/* Radius */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-wider">
                Raggio (r)
              </label>
              {lastUpdated === "r" && (
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                  Modificato
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={radius}
                onChange={(e) => handleInputChange(e.target.value, "r")}
                placeholder="Es. 5"
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-3.5 py-2 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
              />
            </div>
          </div>

          {/* Diameter */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-wider">
                Diametro (d)
              </label>
              {lastUpdated === "d" && (
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                  Modificato
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={diameter}
                onChange={(e) => handleInputChange(e.target.value, "d")}
                placeholder="Es. 10"
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-3.5 py-2 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
              />
            </div>
          </div>

          {/* Circumference */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-wider">
                Circonferenza (C)
              </label>
              {lastUpdated === "c" && (
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                  Modificato
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={circumference}
                onChange={(e) => handleInputChange(e.target.value, "c")}
                placeholder="Es. 31.42"
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-3.5 py-2 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
              />
            </div>
          </div>

          {/* Area */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs sm:text-sm font-mono text-zinc-400 uppercase tracking-wider">
                Area (A)
              </label>
              {lastUpdated === "a" && (
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                  Modificato
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={area}
                onChange={(e) => handleInputChange(e.target.value, "a")}
                placeholder="Es. 78.54"
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-3.5 py-2 text-xs sm:text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-750"
              />
            </div>
          </div>
        </div>

        {/* Visualizer & Formula panel */}
        <div className="bg-zinc-950/20 border border-zinc-800 rounded p-4.5 flex flex-col justify-between items-center min-h-[286px]">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider self-start mb-2">
            Visualizzazione del cerchio
          </span>

          <div className="relative w-48 h-48 flex items-center justify-center my-auto">
            <svg className="w-full h-full transform -rotate-90">
              {/* Grid backdrop circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Actual circle filled representing area */}
              <circle
                cx="96"
                cy="96"
                r={normalizedVisualRadius}
                fill="rgba(99, 102, 241, 0.08)"
                stroke="#6366f1"
                strokeWidth="2"
                className="transition-all duration-350"
              />
              {/* Diameter Line */}
              <line
                x1={96 - normalizedVisualRadius}
                y1="96"
                x2={96 + normalizedVisualRadius}
                y2="96"
                stroke="#e2e8f0"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                opacity="0.35"
              />
              {/* Radius Line */}
              <line
                x1="96"
                y1="96"
                x2={96 + normalizedVisualRadius}
                y2="96"
                stroke="#10b981"
                strokeWidth="2"
                className="transition-all duration-350"
              />
              {/* Center point */}
              <circle cx="96" cy="96" r="4" fill="#10b981" />
            </svg>

            {/* Labels overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none">
              <span className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded-sm border border-zinc-800 not-italic">
                r = {radius}
              </span>
            </div>
          </div>

          <div className="w-full pt-3.5 border-t border-zinc-800/60 mt-2 space-y-1 text-xs font-mono text-zinc-500">
            <div className="flex justify-between">
              <span>Circonferenza (C)</span>
              <span className="not-italic">2 · π · r ≈ {circumference}</span>
            </div>
            <div className="flex justify-between">
              <span>Area (A)</span>
              <span className="not-italic">π · r² ≈ {area}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-zinc-900/40 border border-zinc-800/60 rounded flex gap-3 text-xs text-zinc-400">
        <Info className="w-4.5 h-4.5 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          Tutti i calcoli geometrici utilizzano il valore di pi greco costante ad alta precisione 
          (<code className="font-mono text-zinc-300">Math.PI</code>). Il cerchio nell'anteprima si ridimensiona 
          in base al raggio immesso.
        </p>
      </div>
    </div>
  );
}
