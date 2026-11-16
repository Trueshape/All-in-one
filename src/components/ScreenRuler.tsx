import { useEffect, useRef, useState } from "react";
import { Button, Notice, Segmented, Slider, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

// ID-1 card (credit card, ID card): ISO/IEC 7810, the same size everywhere
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;
// Browsers assume 96 dpi: a guess, wrong on most screens until calibrated
const DEFAULT_PX_PER_MM = 96 / 25.4;
const MM_PER_INCH = 25.4;
const STORAGE_KEY = "screen-ruler-calibration";

type Calibration = { pxPerMm: number; dpr: number };

function loadCalibration(): Calibration | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && saved.pxPerMm > 0 ? saved : null;
  } catch {
    return null;
  }
}

export default function ScreenRuler() {
  const u = useUi();
  const [saved, setSaved] = useState<Calibration | null>(loadCalibration);
  const [mode, setMode] = useState<"ruler" | "calibrate">(saved ? "ruler" : "calibrate");
  const [draft, setDraft] = useState(saved?.pxPerMm ?? DEFAULT_PX_PER_MM);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [marker, setMarker] = useState<number | null>(null); // px from the zero edge
  const [width, setWidth] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const obs = new ResizeObserver(() => setWidth(box.clientWidth));
    obs.observe(box);
    return () => obs.disconnect();
  }, [mode]);

  const pxPerMm = saved?.pxPerMm ?? DEFAULT_PX_PER_MM;
  // Browser zoom or a different screen changes devicePixelRatio: the saved scale is no longer true
  const stale = saved !== null && Math.abs(saved.dpr - window.devicePixelRatio) > 0.01;

  const save = () => {
    const next = { pxPerMm: draft, dpr: window.devicePixelRatio };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // private window: calibration lasts until the page closes
    }
    setSaved(next);
    setMode("ruler");
  };

  // Ticks: millimeters (cm) or sixteenths of an inch
  const ticks: { x: number; h: number; label?: string }[] = [];
  if (width > 0) {
    if (unit === "cm") {
      for (let mm = 0; mm * pxPerMm <= width; mm++) {
        const x = mm * pxPerMm;
        if (mm % 10 === 0) ticks.push({ x, h: 34, label: String(mm / 10) });
        else ticks.push({ x, h: mm % 5 === 0 ? 24 : 14 });
      }
    } else {
      const step = (MM_PER_INCH * pxPerMm) / 16;
      for (let i = 0; i * step <= width; i++) {
        const x = i * step;
        if (i % 16 === 0) ticks.push({ x, h: 34, label: String(i / 16) });
        else ticks.push({ x, h: i % 8 === 0 ? 26 : i % 4 === 0 ? 20 : i % 2 === 0 ? 15 : 10 });
      }
    }
  }

  const markerMm = marker === null ? null : marker / pxPerMm;
  const markerText =
    markerMm === null ? "" : unit === "cm" ? `${(markerMm / 10).toFixed(2)} cm` : `${(markerMm / MM_PER_INCH).toFixed(2)} in`;

  return (
    <Stack>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[
            { value: "ruler", label: "Righello" },
            { value: "calibrate", label: "Calibra" },
          ]}
          value={mode}
          onChange={(m) => {
            setDraft(pxPerMm);
            setMode(m);
          }}
        />
        {mode === "ruler" && (
          <Segmented
            options={[
              { value: "cm", label: "cm" },
              { value: "in", label: "pollici" },
            ]}
            value={unit}
            onChange={setUnit}
          />
        )}
      </div>

      {mode === "ruler" ? (
        <>
          {!saved && <Notice tone="warn">Righello non calibrato: le misure sono una stima. Usa "Calibra" con una carta di credito.</Notice>}
          {stale && <Notice tone="warn">Zoom del browser o schermo cambiati dalla calibrazione: ricalibra per misure esatte.</Notice>}
          <Notice>
            Appoggia l'oggetto allo schermo con un'estremità sul bordo sinistro del righello (lo zero). Clicca sul righello per segnare l'altra estremità.
          </Notice>
          <div
            ref={boxRef}
            className={cx("relative w-full cursor-crosshair select-none", u.text)}
            onClick={(e) => setMarker(e.clientX - e.currentTarget.getBoundingClientRect().left)}
          >
            <svg width={width} height={60} className="block" aria-label="Righello">
              <line x1={0} y1={0} x2={width} y2={0} stroke="currentColor" />
              {ticks.map((t, i) => (
                <g key={i}>
                  <line x1={t.x + 0.5} y1={0} x2={t.x + 0.5} y2={t.h} stroke="currentColor" />
                  {t.label && (
                    <text x={t.x + 3} y={50} fontSize={12} fill="currentColor">
                      {t.label}
                    </text>
                  )}
                </g>
              ))}
              {marker !== null && <line x1={marker} y1={0} x2={marker} y2={60} stroke={u.accentHex} strokeWidth={2} />}
            </svg>
          </div>
          <div className={cx("text-sm", u.subtle)}>
            {marker === null ? "Clicca sul righello per misurare." : <span className={cx("font-mono font-semibold", u.accent)}>{markerText}</span>}
          </div>
        </>
      ) : (
        <>
          <Notice tone="empty">
            Appoggia una carta di credito (o bancomat, tessera sanitaria, carta d'identità) sul rettangolo, allineata all'angolo in alto a sinistra. Muovi il cursore finché i bordi combaciano.
          </Notice>
          <div
            className="rounded-[3mm] border-2"
            style={{ width: CARD_W_MM * draft, height: CARD_H_MM * draft, borderColor: u.accentHex }}
            aria-label="Rettangolo di calibrazione"
          />
          <Slider label="Dimensione" value={draft} min={2} max={12} step={0.005} onChange={setDraft} display={`${Math.round(CARD_W_MM * draft)} px`} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDraft((d) => Math.max(2, d - 0.01))}>− Rimpicciolisci</Button>
            <Button onClick={() => setDraft((d) => Math.min(12, d + 0.01))}>+ Ingrandisci</Button>
            <Button variant="primary" onClick={save}>
              Salva calibrazione
            </Button>
          </div>
        </>
      )}
    </Stack>
  );
}
