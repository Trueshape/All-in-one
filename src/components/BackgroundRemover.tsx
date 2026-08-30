import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  Upload,
  Download,
  Wand2,
  Sliders,
  Eraser,
  Paintbrush,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Palette,
} from "lucide-react";

export default function BackgroundRemover() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("image.png");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Settings
  const [tolerance, setTolerance] = useState<number>(35);
  const [feather, setFeather] = useState<number>(2);
  const [keyColor, setKeyColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [bgType, setBgType] = useState<"transparent" | "color" | "gradient" | "blur">("transparent");
  const [customBgColor, setCustomBgColor] = useState<string>("#ffffff");
  const [gradientPreset, setGradientPreset] = useState<string>("linear-gradient(135deg, #6366f1, #a855f7)");
  const [brushMode, setBrushMode] = useState<"none" | "erase" | "restore">("none");
  const [brushSize, setBrushSize] = useState<number>(20);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);

  // Load image onto canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name.replace(/\.[^/.]+$/, "") + "-no-bg.png");

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      loadImageToCanvas(src);
    };
    reader.readAsDataURL(file);
  };

  const loadImageToCanvas = (src: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      const origCanvas = originalCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !origCanvas || !maskCanvas) return;

      const width = img.width;
      const height = img.height;

      canvas.width = width;
      canvas.height = height;
      origCanvas.width = width;
      origCanvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;

      const origCtx = origCanvas.getContext("2d");
      if (origCtx) origCtx.drawImage(img, 0, 0);

      // Auto-sample top-left corner color as default key color
      const sampleCtx = origCanvas.getContext("2d");
      if (sampleCtx) {
        const pixel = sampleCtx.getImageData(5, 5, 1, 1).data;
        setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
      }

      // Initial mask creation (all visible 255)
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        maskCtx.fillStyle = "white";
        maskCtx.fillRect(0, 0, width, height);
      }

      applyBackgroundRemoval();
    };
    img.src = src;
  };

  // Process background removal algorithm
  const applyBackgroundRemoval = () => {
    const origCanvas = originalCanvasRef.current;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!origCanvas || !canvas || !maskCanvas || !keyColor) return;

    setIsProcessing(true);

    setTimeout(() => {
      const origCtx = origCanvas.getContext("2d");
      const ctx = canvas.getContext("2d");
      const maskCtx = maskCanvas.getContext("2d");
      if (!origCtx || !ctx || !maskCtx) return;

      const width = origCanvas.width;
      const height = origCanvas.height;

      const origData = origCtx.getImageData(0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);
      const outputData = ctx.createImageData(width, height);

      const srcPixels = origData.data;
      const maskPixels = maskData.data;
      const destPixels = outputData.data;

      const maxDist = Math.sqrt(255 * 255 * 3);
      const tolRatio = (tolerance / 100) * maxDist;

      for (let i = 0; i < srcPixels.length; i += 4) {
        const r = srcPixels[i];
        const g = srcPixels[i + 1];
        const b = srcPixels[i + 2];
        const userMaskAlpha = maskPixels[i]; // Manual brush mask

        // Color distance calculation
        const dist = Math.sqrt(
          (r - keyColor.r) ** 2 + (g - keyColor.g) ** 2 + (b - keyColor.b) ** 2
        );

        let alpha = 255;

        if (dist < tolRatio) {
          // Fade out based on distance and feathering
          const diff = tolRatio - dist;
          if (diff > feather * 5) {
            alpha = 0;
          } else {
            alpha = Math.round((1 - diff / (feather * 5 + 1)) * 255);
          }
        }

        // Combine with user manual touch-up mask
        if (userMaskAlpha === 0) alpha = 0;
        if (userMaskAlpha === 255) alpha = srcPixels[i + 3];

        destPixels[i] = r;
        destPixels[i + 1] = g;
        destPixels[i + 2] = b;
        destPixels[i + 3] = Math.min(srcPixels[i + 3], alpha);
      }

      ctx.putImageData(outputData, 0, 0);
      setIsProcessing(false);
    }, 50);
  };

  useEffect(() => {
    if (imageSrc) {
      applyBackgroundRemoval();
    }
  }, [tolerance, feather, keyColor]);

  // Click on image to sample background color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushMode !== "none") return;
    const origCanvas = originalCanvasRef.current;
    if (!origCanvas) return;

    const rect = origCanvas.getBoundingClientRect();
    const scaleX = origCanvas.width / rect.width;
    const scaleY = origCanvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    const origCtx = origCanvas.getContext("2d");
    if (!origCtx) return;

    const pixel = origCtx.getImageData(x, y, 1, 1).data;
    setKeyColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
  };

  // Brush Touch-Up (Erase / Restore)
  const handleMouseDown = () => {
    if (brushMode !== "none") isDrawing.current = true;
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      applyBackgroundRemoval();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || brushMode === "none") return;

    const maskCanvas = maskCanvasRef.current;
    const canvas = canvasRef.current;
    if (!maskCanvas || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize * scaleX, 0, Math.PI * 2);
    maskCtx.fillStyle = brushMode === "erase" ? "black" : "white";
    maskCtx.fill();

    // Quick preview
    applyBackgroundRemoval();
  };

  // Export & Download
  const handleDownload = () => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return;

    // Create final export canvas with selected background
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = mainCanvas.width;
    exportCanvas.height = mainCanvas.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    if (bgType === "color") {
      ctx.fillStyle = customBgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    } else if (bgType === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
      grad.addColorStop(0, "#6366f1");
      grad.addColorStop(1, "#a855f7");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    ctx.drawImage(mainCanvas, 0, 0);

    const link = document.createElement("a");
    link.download = fileName;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>AI Rimozione Sfondo Immagine</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Rimuovi lo sfondo in automatico, ritocca i dettagli a pennello e scarica in formato PNG trasparente.
          </p>
        </div>

        {imageSrc && (
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Scarica PNG Cutout</span>
          </button>
        )}
      </div>

      {/* Upload Drop Zone if no image */}
      {!imageSrc ? (
        <div className="border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-xl p-10 text-center transition-all bg-zinc-950/20">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="bg-remover-upload"
          />
          <label htmlFor="bg-remover-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-mono font-bold text-zinc-200 block">
                Fai clic qui per caricare un'immagine
              </span>
              <span className="text-xs font-mono text-zinc-500 block mt-1">
                Supporta file PNG, JPG, WEBP (Consigliato soggetti ben definiti)
              </span>
            </div>
          </label>
        </div>
      ) : (
        /* Processing Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="space-y-5 bg-zinc-950/60 p-4 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Regolazioni IA</span>
              </span>
              <button
                onClick={() => setImageSrc(null)}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
              >
                Cambia Foto
              </button>
            </div>

            {/* Tolerance Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Tolleranza Colore</span>
                <span className="text-purple-400 font-bold">{tolerance}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Feather Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Sfumatura Bordo (Feather)</span>
                <span className="text-purple-400 font-bold">{feather}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Background Color Picker & Sampling */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-xs font-mono text-zinc-400 block">
                Colore Sfondo Campionato (Clicca sulla foto per cambiarlo)
              </span>
              <div className="flex items-center gap-2">
                {keyColor && (
                  <div
                    className="w-8 h-8 rounded border border-zinc-700 shrink-0 shadow-sm"
                    style={{ backgroundColor: `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` }}
                  />
                )}
                <span className="text-xs font-mono text-zinc-300">
                  {keyColor ? `RGB(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` : "Seleziona colore"}
                </span>
              </div>
            </div>

            {/* Touch-up Brush Tools */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-xs font-mono text-zinc-400 block">Pennello Ritocco Manuale</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setBrushMode("none")}
                  className={`p-2 text-[10px] font-mono rounded border text-center ${
                    brushMode === "none"
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Campionatore
                </button>
                <button
                  onClick={() => setBrushMode("erase")}
                  className={`p-2 text-[10px] font-mono rounded border text-center flex items-center justify-center gap-1 ${
                    brushMode === "erase"
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Eraser className="w-3 h-3" />
                  Cancella
                </button>
                <button
                  onClick={() => setBrushMode("restore")}
                  className={`p-2 text-[10px] font-mono rounded border text-center flex items-center justify-center gap-1 ${
                    brushMode === "restore"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Paintbrush className="w-3 h-3" />
                  Ripristina
                </button>
              </div>

              {brushMode !== "none" && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Dimensione Pennello</span>
                    <span>{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Background Output Preset Selection */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <span className="text-xs font-mono text-zinc-400 block">Sfondo di Anteprima</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() => setBgType("transparent")}
                  className={`p-2 rounded border text-left ${
                    bgType === "transparent"
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                >
                  Trasparente (PNG)
                </button>
                <button
                  onClick={() => setBgType("color")}
                  className={`p-2 rounded border text-left flex items-center gap-1.5 ${
                    bgType === "color"
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  Tinta Unita
                </button>
              </div>

              {bgType === "color" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-300 uppercase">{customBgColor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Anteprima Ritaglio Risultato</span>
              </span>

              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-[11px] font-mono px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded transition-colors"
              >
                {showOriginal ? "Mostra Cutout" : "Mostra Originale"}
              </button>
            </div>

            {/* Canvas Container with Checkerboard / Background */}
            <div
              className="relative w-full min-h-[350px] max-h-[500px] border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center p-2"
              style={{
                backgroundColor: bgType === "color" ? customBgColor : "transparent",
                backgroundImage:
                  bgType === "transparent"
                    ? "radial-gradient(#27272a 1px, transparent 0)"
                    : "none",
                backgroundSize: "16px 16px",
              }}
            >
              {/* Main Cutout Canvas */}
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`max-w-full max-h-[460px] object-contain rounded ${
                  showOriginal ? "hidden" : "block"
                } ${brushMode !== "none" ? "cursor-crosshair" : "cursor-pointer"}`}
              />

              {/* Original Canvas */}
              <canvas
                ref={originalCanvasRef}
                className={`max-w-full max-h-[460px] object-contain rounded ${
                  showOriginal ? "block" : "hidden"
                }`}
              />

              {/* Hidden Mask Canvas */}
              <canvas ref={maskCanvasRef} className="hidden" />

              {isProcessing && (
                <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-purple-400 font-mono text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Elaborazione Sfondo...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
