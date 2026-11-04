import { useMemo, useState } from "react";
import { Download, Plus, X } from "lucide-react";
import { Field, TextInput, Chips, Button, IconButton, Panel, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { SERIES_COLORS, radarSvg } from "../lib/radar";
import type { RadarSeries } from "../lib/radar";
import { download, toBlob } from "../lib/imageOps";

const MIN_AXES = 3;
const MAX_AXES = 12;
const MAX_SERIES = SERIES_COLORS.length;

const start = (): { axes: string[]; series: RadarSeries[] } => ({
  axes: ["Forza", "Velocità", "Tecnica", "Resistenza", "Intelligenza"],
  series: [
    { name: "Giocatore A", color: SERIES_COLORS[0], values: [8, 6, 7, 5, 9] },
    { name: "Giocatore B", color: SERIES_COLORS[1], values: [5, 9, 6, 8, 6] },
  ],
});

/** Edit axes and values in a table, see the radar chart update, and save it as SVG or PNG. */
export default function RadarChartMaker() {
  const u = useUi();
  const [data, setData] = useState(start);
  const [max, setMax] = useState("10");
  const [rings, setRings] = useState(5);
  const maxValue = Number(max.replace(",", ".")) > 0 ? Number(max.replace(",", ".")) : 10;
  const svg = useMemo(() => radarSvg({ axes: data.axes.map((a, i) => a.trim() || `Asse ${i + 1}`), series: data.series.map((s) => ({ ...s, name: s.name.trim() || "Serie" })), max: maxValue, rings }), [data, maxValue, rings]);

  const setAxis = (i: number, label: string) => setData((d) => ({ ...d, axes: d.axes.map((a, k) => (k === i ? label : a)) }));
  const setValue = (s: number, i: number, raw: string) =>
    setData((d) => ({ ...d, series: d.series.map((x, k) => (k === s ? { ...x, values: x.values.map((v, j) => (j === i ? Number(raw.replace(",", ".")) || 0 : v)) } : x)) }));
  const addAxis = () => setData((d) => ({ axes: [...d.axes, `Asse ${d.axes.length + 1}`], series: d.series.map((s) => ({ ...s, values: [...s.values, 0] })) }));
  const removeAxis = (i: number) => setData((d) => ({ axes: d.axes.filter((_, k) => k !== i), series: d.series.map((s) => ({ ...s, values: s.values.filter((_, k) => k !== i) })) }));
  const addSeries = () => setData((d) => ({ ...d, series: [...d.series, { name: `Serie ${d.series.length + 1}`, color: SERIES_COLORS[d.series.length], values: d.axes.map(() => 0) }] }));
  const removeSeries = (s: number) => setData((d) => ({ ...d, series: d.series.filter((_, k) => k !== s).map((x, k) => ({ ...x, color: SERIES_COLORS[k] })) }));

  const downloadSvg = () => download(new Blob([svg], { type: "image/svg+xml" }), "radar.svg");
  const downloadPng = () => {
    const image = new Image();
    image.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 960;
      canvas.getContext("2d")?.drawImage(image, 0, 0, 960, 960);
      const blob = await toBlob(canvas, "image/png");
      if (blob) download(blob, "radar.png");
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 min-w-0">
          <div className={cx("max-h-[26rem] overflow-auto border", u.divider)}>
            <table className="w-full text-sm">
              <thead>
                <tr className={cx("text-[10px] uppercase tracking-wider", u.muted)}>
                  <th className="px-2 py-2 text-left font-semibold">Asse</th>
                  {data.series.map((s, k) => (
                    <th key={k} className="px-1 py-2 font-semibold min-w-36">
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 shrink-0" style={{ background: s.color }} />
                        <TextInput className="h-8 px-2 text-xs" value={s.name} aria-label={`Nome serie ${k + 1}`} onChange={(e) => setData((d) => ({ ...d, series: d.series.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)) }))} />
                        {data.series.length > 1 && <IconButton onClick={() => removeSeries(k)} title="Rimuovi serie" className="shrink-0"><X className="w-3 h-3" /></IconButton>}
                      </span>
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.axes.map((axis, i) => (
                  <tr key={i} className={cx("border-t", u.divider)}>
                    <td className="px-2 py-1 min-w-28"><TextInput className="h-8 px-2 text-xs" value={axis} aria-label={`Nome asse ${i + 1}`} onChange={(e) => setAxis(i, e.target.value)} /></td>
                    {data.series.map((s, k) => (
                      <td key={k} className="px-1 py-1"><TextInput className="h-8 px-2 text-xs" type="number" inputMode="decimal" min={0} step="any" value={s.values[i]} aria-label={`${axis} · ${s.name}`} onChange={(e) => setValue(k, i, e.target.value)} /></td>
                    ))}
                    <td className="px-1 py-1">{data.axes.length > MIN_AXES && <IconButton onClick={() => removeAxis(i)} title="Rimuovi asse"><X className="w-3 h-3" /></IconButton>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={data.axes.length >= MAX_AXES} icon={<Plus className="w-3.5 h-3.5" />} onClick={addAxis}>Asse</Button>
            <Button size="sm" disabled={data.series.length >= MAX_SERIES} icon={<Plus className="w-3.5 h-3.5" />} onClick={addSeries}>Serie</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valore massimo"><TextInput type="number" inputMode="decimal" min={1} step="any" value={max} onChange={(e) => setMax(e.target.value)} /></Field>
            <Field label="Cerchi"><Chips value={rings} onChange={setRings} options={[3, 4, 5, 6, 8].map((n) => ({ value: n, label: String(n) }))} /></Field>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <Panel className="p-2">
            <div className="mx-auto max-w-[26rem] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="Grafico radar" />
          </Panel>
          <div className="flex gap-2">
            <Button variant="primary" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadSvg}>SVG</Button>
            <Button icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPng}>PNG</Button>
          </div>
        </div>
      </div>
      <Notice>I valori sopra il massimo vengono tagliati al bordo del grafico. Servono almeno 3 assi.</Notice>
    </Stack>
  );
}
