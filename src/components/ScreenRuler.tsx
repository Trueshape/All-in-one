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

// Width of the number bands (top and left); the shared zero sits at (OFFSET, OFFSET)
const OFFSET = 60;
// Leaves room in the window for the controls and the readout around the two rulers
const verticalHeight = () => Math.max(120, Math.min(window.innerHeight - 560, 640));

export default function ScreenRuler() {
  const u = useUi();
  const [saved, setSaved] = useState<Calibration | null>(loadCalibration);
  const [mode, setMode] = useState<"ruler" | "calibrate">(saved ? "ruler" : "calibrate");
  const [draft, setDraft] = useState(saved?.pxPerMm ?? DEFAULT_PX_PER_MM);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [marker, setMarker] = useState<number | null>(null); // px from the zero edge
  const [vMarker, setVMarker] = useState<number | null>(null); // px from the top edge of the vertical ruler
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(verticalHeight);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const obs = new ResizeObserver(() => setWidth(box.clientWidth));
    obs.observe(box);
    return () => obs.disconnect();
  }, [mode]);

  useEffect(() => {
    const onResize = () => setHeight(verticalHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
  const makeTicks = (length: number) => {
    const out: { x: number; h: number; label?: string }[] = [];
    if (length <= 0) return out;
    if (unit === "cm") {
      for (let mm = 0; mm * pxPerMm <= length; mm++) {
        const x = mm * pxPerMm;
        if (mm % 10 === 0) out.push({ x, h: 34, label: String(mm / 10) });
        else out.push({ x, h: mm % 5 === 0 ? 24 : 14 });
      }
    } else {
      const step = (MM_PER_INCH * pxPerMm) / 16;
      for (let i = 0; i * step <= length; i++) {
        const x = i * step;
        if (i % 16 === 0) out.push({ x, h: 34, label: String(i / 16) });
        else out.push({ x, h: i % 8 === 0 ? 26 : i % 4 === 0 ? 20 : i % 2 === 0 ? 15 : 10 });
      }
    }
    return out;
  };
  const hTicks = makeTicks(width - OFFSET);
  const vTicks = makeTicks(height);

  const lengthText = (px: number) => {
    const mm = px / pxPerMm;
    return unit === "cm" ? `${(mm / 10).toFixed(2)} cm` : `${(mm / MM_PER_INCH).toFixed(2)} in`;
  };
  const readout = [marker !== null && `Orizzontale ${lengthText(marker)}`, vMarker !== null && `Verticale ${lengthText(vMarker)}`].filter(Boolean).join("  ·  ");

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
            Appoggia l'oggetto allo schermo con un'estremità nell'angolo dove i due righelli si incontrano (lo zero). Clicca sulla fascia dei numeri in alto o a sinistra per segnare l'altra estremità.
          </Notice>
          {/* One L-shaped frame: both rulers share the zero at the inner corner (OFFSET, OFFSET); numbers sit outside, on the top and left bands. */}
          <div ref={boxRef} className={cx("w-full select-none", u.text)}>
            <svg
              width={width}
              height={OFFSET + height}
              className="block cursor-crosshair"
              aria-label="Righelli"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                if (y < OFFSET && x >= OFFSET) setMarker(x - OFFSET);
                else if (x < OFFSET && y >= OFFSET) setVMarker(y - OFFSET);
              }}
            >
              <line x1={OFFSET} y1={OFFSET} x2={width} y2={OFFSET} stroke="currentColor" />
              {hTicks.map((t, i) => (
                <g key={i}>
                  <line x1={OFFSET + t.x + 0.5} y1={OFFSET} x2={OFFSET + t.x + 0.5} y2={OFFSET - t.h} stroke="currentColor" />
                  {t.label && (
                    <text x={OFFSET + t.x + 3} y={14} fontSize={12} fill="currentColor">
                      {t.label}
                    </text>
                  )}
                </g>
              ))}
              {marker !== null && <line x1={OFFSET + marker} y1={0} x2={OFFSET + marker} y2={OFFSET} stroke={u.accentHex} strokeWidth={2} />}
              <line x1={OFFSET} y1={OFFSET} x2={OFFSET} y2={OFFSET + height} stroke="currentColor" />
              {vTicks.map((t, i) => (
                <g key={i}>
                  <line x1={OFFSET} y1={OFFSET + t.x + 0.5} x2={OFFSET - t.h} y2={OFFSET + t.x + 0.5} stroke="currentColor" />
                  {t.label && (
                    <text x={4} y={OFFSET + t.x + 14} fontSize={12} fill="currentColor">
                      {t.label}
                    </text>
                  )}
                </g>
              ))}
              {vMarker !== null && <line x1={0} y1={OFFSET + vMarker} x2={OFFSET} y2={OFFSET + vMarker} stroke={u.accentHex} strokeWidth={2} />}
            </svg>
          </div>
          <div className={cx("text-sm", u.subtle)}>
            {readout ? <span className={cx("font-mono font-semibold", u.accent)}>{readout}</span> : "Clicca sui righelli per misurare."}
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
