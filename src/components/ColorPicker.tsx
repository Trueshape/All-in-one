import { useState, useEffect } from "react";
import { Palette, Copy, Check, Sliders } from "lucide-react";

export default function ColorPicker() {
  const [color, setColor] = useState<string>("#4f46e5"); // indigo-600
  const [rgb, setRgb] = useState<{ r: number; g: number; b: number }>({ r: 79, g: 70, b: 229 });
  const [hsl, setHsl] = useState<{ h: number; s: number; l: number }>({ h: 243, s: 75, l: 59 });
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Helper conversions
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const y = Math.min(k(n) - 3, 9 - k(n), 1);
      return Math.max(-1, y);
    };
    const r = Math.round(255 * (l - a * Math.max(-1, Math.min(f(0), 1))));
    const g = Math.round(255 * (l - a * Math.max(-1, Math.min(f(8), 1))));
    const b = Math.round(255 * (l - a * Math.max(-1, Math.min(f(4), 1))));
    return rgbToHex(r, g, b);
  };

  useEffect(() => {
    const updatedRgb = hexToRgb(color);
    setRgb(updatedRgb);
    setHsl(rgbToHsl(updatedRgb.r, updatedRgb.g, updatedRgb.b));
  }, [color]);

  const handleRgbSliderChange = (key: "r" | "g" | "b", val: number) => {
    const nextRgb = { ...rgb, [key]: val };
    setRgb(nextRgb);
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setColor(nextHex);
    setHsl(rgbToHsl(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const handleCopy = (format: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1800);
  };

  // Generate palettes
  const getComplementaryHex = (): string => {
    const nextHue = (hsl.h + 180) % 360;
    return hslToHex(nextHue, hsl.s, hsl.l);
  };

  const getAnalogousHex = (): string[] => {
    const h1 = (hsl.h + 30) % 360;
    const h2 = (hsl.h - 30 + 360) % 360;
    return [hslToHex(h1, hsl.s, hsl.l), hslToHex(h2, hsl.s, hsl.l)];
  };

  const getTriadicHex = (): string[] => {
    const h1 = (hsl.h + 120) % 360;
    const h2 = (hsl.h + 240) % 360;
    return [hslToHex(h1, hsl.s, hsl.l), hslToHex(h2, hsl.s, hsl.l)];
  };

  const getMonochromaticHex = (): string[] => {
    return [
      hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 25)),
      hslToHex(hsl.h, hsl.s, Math.max(20, hsl.l - 12)),
      hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 12)),
      hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 25)),
    ];
  };

  const formatRgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const formatHslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="space-y-6">
      {/* Upper Area Picker */}
      <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
        {/* Swatch & Picker */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className="w-24 h-24 rounded-2xl shadow-inner border border-zinc-800/80 relative"
            style={{ backgroundColor: color }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              id="native-color-picker"
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Clicca per scegliere</span>
        </div>

        {/* Copy Formats */}
        <div className="space-y-2">
          {/* HEX */}
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">HEX</span>
              <span className="font-mono text-sm font-semibold text-zinc-200">{color.toUpperCase()}</span>
            </div>
            <button
              onClick={() => handleCopy("HEX", color.toUpperCase())}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              id="btn-copy-hex"
            >
              {copiedFormat === "HEX" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* RGB */}
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">RGB</span>
              <span className="font-mono text-xs font-semibold text-zinc-300">{formatRgbStr}</span>
            </div>
            <button
              onClick={() => handleCopy("RGB", formatRgbStr)}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              id="btn-copy-rgb"
            >
              {copiedFormat === "RGB" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* HSL */}
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
            <div className="space-y-0.5">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">HSL</span>
              <span className="font-mono text-xs font-semibold text-zinc-300">{formatHslStr}</span>
            </div>
            <button
              onClick={() => handleCopy("HSL", formatHslStr)}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
              id="btn-copy-hsl"
            >
              {copiedFormat === "HSL" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sliders Area */}
      <div className="space-y-3 bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-3">
        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
          <Sliders className="w-3.5 h-3.5 text-zinc-500" /> Slider Canali RGB
        </div>
        
        {/* Red Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-rose-500 font-medium">Rosso (R)</span>
            <span className="text-zinc-300">{rgb.r}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleRgbSliderChange("r", parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            id="slider-color-r"
          />
        </div>

        {/* Green Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-emerald-500 font-medium">Verde (G)</span>
            <span className="text-zinc-300">{rgb.g}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleRgbSliderChange("g", parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            id="slider-color-g"
          />
        </div>

        {/* Blue Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-blue-500 font-medium">Blu (B)</span>
            <span className="text-zinc-300">{rgb.b}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleRgbSliderChange("b", parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            id="slider-color-b"
          />
        </div>
      </div>

      {/* Generated Palettes */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <Palette className="w-3.5 h-3.5 text-indigo-400" /> Palette Armoniche
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Complementary & Analogous */}
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Complementare</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy("complementary", getComplementaryHex())}
                  className="w-10 h-8 rounded-lg border border-zinc-800/40 relative group shrink-0"
                  style={{ backgroundColor: getComplementaryHex() }}
                  title="Copia colore"
                  id="btn-pal-complementary"
                >
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity text-white text-[10px] font-bold">HEX</span>
                </button>
                <span className="font-mono text-zinc-300 font-medium">{getComplementaryHex().toUpperCase()}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Analoga</span>
              <div className="flex gap-2">
                {getAnalogousHex().map((hex, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(`analogous-${idx}`, hex)}
                      className="w-8 h-8 rounded-lg border border-zinc-800/40 relative group"
                      style={{ backgroundColor: hex }}
                      title="Copia colore"
                      id={`btn-pal-analogous-${idx}`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity text-white text-[8px] font-bold">HEX</span>
                    </button>
                  </div>
                ))}
                <span className="font-mono text-zinc-500 text-[10px] pt-2">Toni limitrofi</span>
              </div>
            </div>
          </div>

          {/* Triadic & Monochromatic */}
          <div className="space-y-2">
            <div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Triade</span>
              <div className="flex gap-2">
                {getTriadicHex().map((hex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(`triadic-${idx}`, hex)}
                    className="w-8 h-8 rounded-lg border border-zinc-800/40 relative group"
                    style={{ backgroundColor: hex }}
                    title="Copia colore"
                    id={`btn-pal-triadic-${idx}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity text-white text-[8px] font-bold">HEX</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Monocromatica</span>
              <div className="flex gap-1.5">
                {getMonochromaticHex().map((hex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopy(`mono-${idx}`, hex)}
                    className="w-7 h-7 rounded-md border border-zinc-800/30 relative group"
                    style={{ backgroundColor: hex }}
                    title="Copia colore"
                    id={`btn-pal-mono-${idx}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-md transition-opacity text-white text-[6px] font-bold">HEX</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
