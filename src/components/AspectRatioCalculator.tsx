import React, { useState, useEffect } from "react";
import { Maximize, Info } from "lucide-react";

export default function AspectRatioCalculator() {
  const [width, setWidth] = useState<string>("1920");
  const [height, setHeight] = useState<string>("1080");
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [ratioWidth, setRatioWidth] = useState<string>("16");
  const [ratioHeight, setRatioHeight] = useState<string>("9");

  // Helper to find Great Common Divisor
  const findGcd = (a: number, b: number): number => {
    return b === 0 ? a : findGcd(b, a % b);
  };

  const getSimplifiedRatio = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return "N/D";
    const gcd = findGcd(Math.round(w), Math.round(h));
    return `${Math.round(w) / gcd}:${Math.round(h) / gcd}`;
  };

  const currentRatio = getSimplifiedRatio();

  const handleWidthChange = (val: string) => {
    setWidth(val);
    const w = parseFloat(val);
    if (!isNaN(w) && w > 0 && lockRatio) {
      const rw = parseFloat(ratioWidth);
      const rh = parseFloat(ratioHeight);
      if (rw > 0 && rh > 0) {
        setHeight(String(Math.round((w * rh) / rw)));
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    const h = parseFloat(val);
    if (!isNaN(h) && h > 0 && lockRatio) {
      const rw = parseFloat(ratioWidth);
      const rh = parseFloat(ratioHeight);
      if (rw > 0 && rh > 0) {
        setWidth(String(Math.round((h * rw) / rh)));
      }
    }
  };

  const applyPreset = (presetW: number, presetH: number) => {
    setRatioWidth(String(presetW));
    setRatioHeight(String(presetH));
    const w = parseFloat(width);
    if (w > 0) {
      setHeight(String(Math.round((w * presetH) / presetW)));
    }
  };

  useEffect(() => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const gcd = findGcd(Math.round(w), Math.round(h));
      setRatioWidth(String(Math.round(w) / gcd));
      setRatioHeight(String(Math.round(h) / gcd));
    }
  }, [lockRatio]);

  const wNum = parseFloat(width) || 16;
  const hNum = parseFloat(height) || 9;
  const maxW = 340;
  const maxH = 180;
  const visualScale = Math.min(maxW / wNum, maxH / hNum) || 1;
  const visualWidth = wNum * visualScale;
  const visualHeight = hNum * visualScale;

  return (
    <div className="space-y-6">
      {/* Inputs, checkbox and presets */}
      <div className="space-y-6">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
          Risoluzione e Proporzioni
        </span>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-mono text-zinc-400 block mb-1.5">Larghezza</label>
            <input
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          </div>
          <div>
            <label className="text-sm font-mono text-zinc-400 block mb-1.5">Altezza</label>
            <input
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-4 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-800/60 p-3.5 rounded">
          <input
            type="checkbox"
            id="lock-ratio"
            checked={lockRatio}
            onChange={(e) => setLockRatio(e.target.checked)}
            className="rounded bg-zinc-950 border-zinc-850 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4.5 h-4.5"
          />
          <label htmlFor="lock-ratio" className="text-sm font-mono text-zinc-300 cursor-pointer select-none">
            Mantieni proporzioni (<strong className="text-indigo-400 font-bold not-italic">{ratioWidth}:{ratioHeight}</strong>)
          </label>
        </div>

        <div>
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-3">
            Preset Comuni Aspect Ratio
          </span>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "16:9", w: 16, h: 9, description: "Panoramico" },
              { label: "9:16", w: 9, h: 16, description: "Verticale" },
              { label: "4:3", w: 4, h: 3, description: "Standard" },
              { label: "1:1", w: 1, h: 1, description: "Quadrato" },
              { label: "21:9", w: 21, h: 9, description: "Cinema" },
              { label: "16:10", w: 16, h: 10, description: "Desktop" },
            ].map((preset) => {
              const isActive = parseFloat(ratioWidth) === preset.w && parseFloat(ratioHeight) === preset.h;
              return (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset.w, preset.h)}
                  className={`px-2 py-2 text-xs font-mono rounded text-center transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-500/10 border border-indigo-500 text-indigo-400 font-bold"
                      : "bg-zinc-950/40 border border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                  title={`${preset.label} (${preset.description})`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Screen Simulation Block Below */}
      <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6 flex flex-col justify-between items-center min-h-[240px] mt-6">
        <div className="w-full flex justify-between items-center mb-4">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Simulazione Schermo
          </span>
        </div>

        {/* Scaled Preview Box */}
        <div className="w-full flex-1 flex items-center justify-center bg-zinc-950/50 rounded-lg p-5 border border-zinc-900">
          <div
            style={{
              width: `${visualWidth}px`,
              height: `${visualHeight}px`,
            }}
            className="border-2 border-indigo-500/80 bg-indigo-500/10 rounded flex flex-col items-center justify-center text-center p-3 transition-all duration-300 relative shadow-lg shadow-indigo-950/10"
          >
            <Maximize className="w-5 h-5 text-indigo-400 mb-1.5" />
            <span className="text-xs sm:text-sm font-mono font-bold text-zinc-100 not-italic">
              {width} x {height}
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-indigo-300 mt-1 not-italic">
              Ratio: {currentRatio}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded flex gap-2.5 text-xs text-zinc-400 mt-4">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          L'Aspect Ratio descrive il rapporto matematico tra la larghezza e l'altezza di un'immagine o schermo. 
          Attivando la proporzione bloccata, qualsiasi variazione di larghezza o altezza ricalcolerà la misura opposta.
        </p>
      </div>
    </div>
  );
}
