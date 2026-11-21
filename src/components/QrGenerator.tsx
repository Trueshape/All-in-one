import { useMemo, useState } from "react";
import { Download, QrCode, Type, Wifi } from "lucide-react";
import { Field, TextInput, TextArea, Select, Segmented, Chips, Button, Panel, Notice, Stack } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { QUIET_ZONE, buildMatrix, contrast, luminance, wifiPayload } from "../lib/qr";
import type { QrLevel as Level } from "../lib/qr";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const payload = mode === "wifi" ? wifiPayload(ssid, wifiPassword, security) : text;

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
        fill
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
                <TextInput value={ssid} maxLength={32} onChange={(e) => setSsid(e.target.value)} placeholder="Nome della rete" />
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
                  <TextInput type="password" autoComplete="off" maxLength={63} value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} placeholder="Password di rete" />
                </Field>
              )}
            </>
          )}

          <Field label="Correzione errori">
            <Chips fill value={level} onChange={setLevel} options={(["L", "M", "Q", "H"] as Level[]).map((l) => ({ value: l, label: l }))} />
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
          <Button variant="primary" className="w-full" disabled={!matrix} icon={<Download className="w-4 h-4" />} onClick={downloadPng}>PNG</Button>
          <Notice>Il codice è generato nel browser: nessun dato viene inviato a servizi esterni.</Notice>
        </Panel>
      </div>
    </Stack>
  );
}
