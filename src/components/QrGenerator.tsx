import { useState } from "react";
import { QrCode, Download, Settings, RefreshCw, Wifi, Type, Check, Link } from "lucide-react";

export default function QrGenerator() {
  const [mode, setMode] = useState<"text" | "wifi">("text");
  const [text, setText] = useState<string>("https://ai.studio/build");
  
  // WiFi Fields
  const [ssid, setSsid] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [security, setSecurity] = useState<string>("WPA");

  // Customizations
  const [fgColor, setFgColor] = useState<string>("#000000");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Build the QR payload
  const getPayload = (): string => {
    if (mode === "wifi") {
      // WiFi format: WIFI:S:SSID;T:WPA;P:PASSWORD;;
      const s = ssid.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,");
      const p = password.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/:/g, "\\:").replace(/,/g, "\\,");
      return `WIFI:S:${s};T:${security};P:${p};;`;
    }
    return text;
  };

  const payload = getPayload();
  const fgHex = fgColor.substring(1); // remove '#'
  const bgHex = bgColor.substring(1); // remove '#'

  // QR Server URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=${fgHex}&bgcolor=${bgHex}&data=${encodeURIComponent(payload)}`;

  const handleDownload = async () => {
    if (!payload.trim()) return;
    setDownloading(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode_${mode}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed, opening in window:", error);
      window.open(qrUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Mode */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
        <button
          onClick={() => setMode("text")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === "text"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-qr-text-mode"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Testo / URL</span>
        </button>
        <button
          onClick={() => setMode("wifi")}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            mode === "wifi"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          id="btn-qr-wifi-mode"
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Rete WiFi</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Form Controls */}
        <div className="space-y-4 order-2 md:order-1">
          {mode === "text" ? (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Testo o Link URL</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-zinc-700 font-medium text-sm transition-all"
                placeholder="Inserisci un testo o un link..."
                id="input-qr-text"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Rete (SSID)</label>
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-zinc-700 font-medium text-sm transition-all"
                  placeholder="SSID della rete"
                  id="input-qr-ssid"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-zinc-700 font-medium text-sm transition-all"
                  placeholder="Password di rete"
                  id="input-qr-wifi-pass"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Protezione</label>
                <select
                  value={security}
                  onChange={(e) => setSecurity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-zinc-700 font-medium"
                  id="select-qr-wifi-sec"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Nessuna password</option>
                </select>
              </div>
            </div>
          )}

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Colore Codice</label>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-800 cursor-pointer bg-transparent"
                  id="picker-qr-fg"
                />
                <span className="font-mono text-xs font-medium text-zinc-300">{fgColor.toUpperCase()}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Colore Sfondo</label>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-800 cursor-pointer bg-transparent"
                  id="picker-qr-bg"
                />
                <span className="font-mono text-xs font-medium text-zinc-300">{bgColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="order-1 md:order-2 flex flex-col items-center justify-center p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl relative space-y-4">
          <div className="w-48 h-48 bg-white p-2 rounded-xl border border-zinc-200/20 shadow-md relative overflow-hidden flex items-center justify-center">
            {payload.trim() ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-zinc-400 text-xs text-center flex flex-col items-center gap-1.5">
                <QrCode className="w-8 h-8 text-zinc-600" />
                <span>Nessun contenuto</span>
              </div>
            )}
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading || !payload.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-950/20 active:scale-95"
            id="btn-qr-download"
          >
            {downloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Scarica QR Code</span>
          </button>
        </div>
      </div>
    </div>
  );
}
