import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCw, ShieldCheck } from "lucide-react";
import { Slider, Toggle, Panel, IconButton, CopyButton, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";

const SETS = {
  upper: { label: "Maiuscole (A-Z)", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  lower: { label: "Minuscole (a-z)", chars: "abcdefghijklmnopqrstuvwxyz" },
  digits: { label: "Numeri (0-9)", chars: "0123456789" },
  symbols: { label: "Simboli (!@#)", chars: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
} as const;

type SetKey = keyof typeof SETS;
const SIMILAR = /[ILOilo01|.,]/g;

/** Uniform random integer in [0, max) using crypto.getRandomValues with rejection sampling. */
function randomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

function generate(length: number, enabled: SetKey[], excludeSimilar: boolean): string {
  const pools = enabled.map((k) => (excludeSimilar ? SETS[k].chars.replace(SIMILAR, "") : SETS[k].chars));
  const all = pools.join("");
  if (!all) return "";
  // One guaranteed character per enabled set, the rest from the full pool, then shuffled.
  const chars = pools.map((p) => p[randomInt(p.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join("");
}

const STRENGTH = [
  { min: 0, label: "Debole", bar: "bg-red-500", width: "25%" },
  { min: 40, label: "Media", bar: "bg-amber-500", width: "50%" },
  { min: 60, label: "Forte", bar: "bg-sky-500", width: "75%" },
  { min: 80, label: "Molto sicura", bar: "bg-emerald-500", width: "100%" },
];

export default function PasswordGenerator() {
  const u = useUi();
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Record<SetKey, boolean>>({ upper: true, lower: true, digits: true, symbols: true });
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState("");

  const active = useMemo(() => (Object.keys(SETS) as SetKey[]).filter((k) => enabled[k]), [enabled]);

  const regenerate = useCallback(() => setPassword(generate(length, active, excludeSimilar)), [length, active, excludeSimilar]);
  useEffect(regenerate, [regenerate]);

  // Entropy estimate: length × log2(pool size)
  const poolSize = active.reduce((sum, k) => sum + (excludeSimilar ? SETS[k].chars.replace(SIMILAR, "") : SETS[k].chars).length, 0);
  const entropy = poolSize > 1 ? length * Math.log2(poolSize) : 0;
  const strength = [...STRENGTH].reverse().find((s) => entropy >= s.min) ?? STRENGTH[0];

  return (
    <Stack>
      <Panel className="flex items-center justify-between gap-3">
        <div className={cx("font-mono text-lg break-all select-all min-w-0", u.text)}>{password || "—"}</div>
        <div className="flex shrink-0">
          <IconButton onClick={regenerate} disabled={!active.length} title="Rigenera">
            <RotateCw className="w-4 h-4" />
          </IconButton>
          <CopyButton text={password} label="Copia password" />
        </div>
      </Panel>

      {!active.length && <Notice tone="warn">Seleziona almeno un tipo di carattere.</Notice>}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className={cx("inline-flex items-center gap-1.5", u.muted)}>
            <ShieldCheck className="w-3.5 h-3.5" /> Robustezza
          </span>
          <span className={cx("font-semibold", u.text)}>
            {strength.label} · {Math.round(entropy)} bit
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800/60 overflow-hidden">
          <div className={cx("h-full transition-all duration-300", strength.bar)} style={{ width: active.length ? strength.width : "0%" }} />
        </div>
      </div>

      <Slider label="Lunghezza" value={length} min={4} max={64} onChange={setLength} />

      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(SETS) as SetKey[]).map((k) => (
          <Panel key={k} className="p-2.5">
            <Toggle checked={enabled[k]} onChange={(v) => setEnabled((prev) => ({ ...prev, [k]: v }))} label={SETS[k].label} />
          </Panel>
        ))}
      </div>

      <Panel className="p-2.5">
        <Toggle checked={excludeSimilar} onChange={setExcludeSimilar} label="Escludi caratteri simili (I, l, 1, O, 0, |)" />
      </Panel>
    </Stack>
  );
}
