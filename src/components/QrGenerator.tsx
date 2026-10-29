import { useMemo, useState } from "react";
import { Download, QrCode, Type, Wifi } from "lucide-react";
import qrcode from "qrcode-generator";
import { Field, TextInput, TextArea, Select, Segmented, Chips, Button, Panel, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";

// The encoder defaults to Latin-1: force UTF-8 so accents and emoji survive.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

type Level = "L" | "M" | "Q" | "H";

const QUIET_ZONE = 4;

const escapeWifi = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");

function buildMatrix(data: string, level: Level): boolean[][] {
  const qr = qrcode(0, level);
  qr.addData(data);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QrGenerator() {
  const u = useUi();
  const [mode, setMode] = useState<"text" | "wifi">("text");
  const [text, setText] = useState("https://example.com");
  const [ssid, setSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [security, setSecurity] = useState("WPA");
  const [level, setLevel] = useState<Level>("M");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");

  const payload = mode === "wifi"
    ? ssid ? `WIFI:T:${security};S:${escapeWifi(ssid)};${security === "nopass" ? "" : `P:${escapeWifi(wifiPassword)};`};` : ""
    : text;

  const { matrix, error } = useMemo(() => {
    if (!payload.trim()) return { matrix: null, error: null };
    try {
      return { matrix: buildMatrix(payload, level), error: null };
    } catch {
      return { matrix: null, error: "Contenuto troppo lungo per un QR code a questo livello di correzione." };
    }
  }, [payload, level]);

  const size = matrix ? matrix.length + QUIET_ZONE * 2 : 0;
  const path = useMemo(() => {
    if (!matrix) return "";
    let d = "";
    matrix.forEach((row, r) => row.forEach((dark, c) => {
      if (dark) d += `M${c + QUIET_ZONE} ${r + QUIET_ZONE}h1v1h-1z`;
    }));
    return d;
  }, [matrix]);

  const svgMarkup = matrix
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bg}"/><path d="${path}" fill="${fg}"/></svg>`
    : "";

  const downloadSvg = () => download(new Blob([svgMarkup], { type: "image/svg+xml" }), `qrcode_${mode}.svg`);

  const downloadPng = () => {
    if (!matrix) return;
    const scale = Math.ceil(1024 / size);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fg;
    matrix.forEach((row, r) => row.forEach((dark, c) => {
      if (dark) ctx.fillRect((c + QUIET_ZONE) * scale, (r + QUIET_ZONE) * scale, scale, scale);
    }));
    canvas.toBlob((blob) => blob && download(blob, `qrcode_${mode}.png`), "image/png");
  };

  const lowContrast = contrast(fg, bg) < 3 || luminance(fg) > luminance(bg);

  return (
    <Stack>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "text", label: <span className="inline-flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> Testo / URL</span> },
          { value: "wifi", label: <span className="inline-flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> Rete Wi-Fi</span> },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {mode === "text" ? (
            <Field label="Testo o link">
              <TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Inserisci un testo o un link..." />
            </Field>
          ) : (
            <>
              <Field label="Nome rete (SSID)">
                <TextInput value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="Nome della rete" />
              </Field>
              <Field label="Protezione">
                <Select value={security} onChange={(e) => setSecurity(e.target.value)}>
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">Nessuna password</option>
                </Select>
              </Field>
              {security !== "nopass" && (
                <Field label="Password">
                  <TextInput type="password" autoComplete="off" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Password di rete" />
                </Field>
              )}
            </>
          )}

          <Field label="Correzione errori">
            <Chips value={level} onChange={setLevel} options={(["L", "M", "Q", "H"] as Level[]).map((l) => ({ value: l, label: l }))} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Colore codice">
              <div className="flex items-center gap-2"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" /><span className={`font-mono text-xs ${u.subtle}`}>{fg.toUpperCase()}</span></div>
            </Field>
            <Field label="Colore sfondo">
              <div className="flex items-center gap-2"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-9 h-9 bg-transparent cursor-pointer" /><span className={`font-mono text-xs ${u.subtle}`}>{bg.toUpperCase()}</span></div>
            </Field>
          </div>
          {lowContrast && <Notice tone="warn">Contrasto basso o colori invertiti: il codice potrebbe non essere letto dai telefoni.</Notice>}
        </div>

        <Panel className="flex flex-col items-center gap-4">
          <div className="w-52 h-52 flex items-center justify-center border border-zinc-800/60" style={{ background: bg }}>
            {matrix ? (
              <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" shapeRendering="crispEdges" role="img" aria-label="QR code">
                <rect width={size} height={size} fill={bg} />
                <path d={path} fill={fg} />
              </svg>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-zinc-500 text-xs"><QrCode className="w-8 h-8" /><span>Nessun contenuto</span></div>
            )}
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex gap-2 w-full">
            <Button variant="primary" className="flex-1" disabled={!matrix} icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPng}>PNG</Button>
            <Button className="flex-1" disabled={!matrix} icon={<Download className="w-3.5 h-3.5" />} onClick={downloadSvg}>SVG</Button>
          </div>
          <p className={`text-[11px] text-center ${u.muted}`}>Il codice è generato nel browser: nessun dato viene inviato a servizi esterni.</p>
        </Panel>
      </div>
    </Stack>
  );
}
