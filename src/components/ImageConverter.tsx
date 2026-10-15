import React, { useState, useRef } from "react";
import { Image as ImageIcon, Info, Download, Trash2, ArrowRight } from "lucide-react";

export default function ImageConverter() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("image");
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [originalSize, setOriginalSize] = useState<number>(0); // in bytes
  const [targetWidth, setTargetWidth] = useState<string>("");
  const [targetHeight, setTargetHeight] = useState<string>("");
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [quality, setQuality] = useState<number>(90);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name.substring(0, file.name.lastIndexOf(".")) || "immagine");
    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        
        // Load image to get original dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalWidth(img.width);
          setOriginalHeight(img.height);
          setTargetWidth(String(img.width));
          setTargetHeight(String(img.height));
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWidthChange = (val: string) => {
    setTargetWidth(val);
    const w = parseFloat(val);
    if (!isNaN(w) && w > 0 && maintainAspect && originalWidth > 0) {
      const computedH = Math.round((w * originalHeight) / originalWidth);
      setTargetHeight(String(computedH));
    }
  };

  const handleHeightChange = (val: string) => {
    setTargetHeight(val);
    const h = parseFloat(val);
    if (!isNaN(h) && h > 0 && maintainAspect && originalHeight > 0) {
      const computedW = Math.round((h * originalWidth) / originalHeight);
      setTargetWidth(String(computedW));
    }
  };

  const handleDownload = () => {
    if (!selectedImage || !imageRef.current) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const w = parseInt(targetWidth) || originalWidth;
      const h = parseInt(targetHeight) || originalHeight;

      canvas.width = w;
      canvas.height = h;

      if (ctx) {
        // If converting to jpeg, draw white background first
        if (format === "jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(imageRef.current, 0, 0, w, h);

        const mimeType = `image/${format}`;
        const dataUrl = canvas.toDataURL(mimeType, format === "png" ? undefined : quality / 100);

        const link = document.createElement("a");
        link.download = `${imageName}_convertito.${format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setOriginalSize(0);
    setTargetWidth("");
    setTargetHeight("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload or Preview Block */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
            Carica Immagine sorgente
          </span>

          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/60 transition-all rounded-lg p-10 flex flex-col items-center justify-center gap-3 cursor-pointer select-none text-center h-64"
            >
              <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-full text-zinc-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono text-zinc-300 font-bold">Seleziona o trascina un'immagine</p>
                <p className="text-[10px] font-mono text-zinc-500 mt-1">Supportati: PNG, JPG, WEBP, GIF</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-zinc-800 bg-zinc-950/50 rounded-lg p-4 flex flex-col items-center justify-center relative min-h-[256px]">
              <button
                onClick={clearImage}
                className="absolute top-3 right-3 p-1.5 bg-zinc-900/80 hover:bg-rose-950/20 border border-zinc-800 hover:border-rose-900/40 rounded text-zinc-400 hover:text-rose-400 transition-colors"
                title="Rimuovi immagine"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="max-h-48 overflow-hidden rounded border border-zinc-900 shadow-md">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Original Preview"
                  className="max-h-44 object-contain max-w-full"
                />
              </div>

              <div className="w-full mt-4 pt-3 border-t border-zinc-900 text-[10px] font-mono text-zinc-500 flex justify-between px-1">
                <span>Risoluzione: {originalWidth}x{originalHeight} px</span>
                <span>Peso: {formatSize(originalSize)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Options and Conversion panel */}
        <div className="bg-zinc-950/20 border border-zinc-800 rounded p-5 flex flex-col justify-between min-h-[260px]">
          <div className="space-y-4">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Opzioni di conversione
            </span>

            {/* Target dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">Larghezza Target (px)</label>
                <input
                  type="number"
                  disabled={!selectedImage}
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">Altezza Target (px)</label>
                <input
                  type="number"
                  disabled={!selectedImage}
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="maintain-aspect-img"
                disabled={!selectedImage}
                checked={maintainAspect}
                onChange={(e) => setMaintainAspect(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-850 text-indigo-500 focus:ring-0 focus:ring-offset-0 disabled:opacity-50"
              />
              <label htmlFor="maintain-aspect-img" className="text-[10px] font-mono text-zinc-400 cursor-pointer select-none">
                Mantieni proporzioni originali
              </label>
            </div>

            {/* Output format */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">Formato Output</label>
              <div className="grid grid-cols-3 gap-2">
                {(["jpeg", "png", "webp"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    disabled={!selectedImage}
                    className={`px-2.5 py-1.5 text-[10px] font-mono border rounded uppercase transition-all ${
                      format === fmt
                        ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-bold"
                        : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for jpeg/webp) */}
            {format !== "png" && (
              <div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                  <span>Qualità Compressione</span>
                  <span className="text-indigo-400 font-bold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  disabled={!selectedImage}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={!selectedImage || isProcessing}
            className="w-full mt-4 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/20 text-xs font-mono font-bold rounded text-indigo-400 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            {isProcessing ? "Elaborazione..." : "Salva e Scarica"}
          </button>
        </div>
      </div>

      <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded flex gap-2.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-sans">
          La conversione e il ridimensionamento delle immagini avvengono interamente in locale nel tuo browser. Nessun file viene inviato a server esterni, garantendo la tua totale privacy.
        </p>
      </div>
    </div>
  );
}
