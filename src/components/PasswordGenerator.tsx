import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCw, ShieldCheck } from "lucide-react";
import { Slider, Toggle, Panel, IconButton, CopyButton, Notice, Stack, Chips, Field, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { PASSPHRASE_BITS_PER_WORD, PRONOUNCEABLE_BITS, passphrase, pin, pronounceable, randomInt, token } from "../lib/passwordModes";
import type { TokenFormat } from "../lib/passwordModes";

const SETS = {
  upper: { label: "Maiuscole (A-Z)", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  lower: { label: "Minuscole (a-z)", chars: "abcdefghijklmnopqrstuvwxyz" },
  digits: { label: "Numeri (0-9)", chars: "0123456789" },
  symbols: { label: "Simboli (!@#)", chars: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
} as const;

type SetKey = keyof typeof SETS;
type Mode = "random" | "passphrase" | "pronounceable" | "pin" | "token";
const SIMILAR = /[ILOilo01|.,]/g;

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

const MODES: Array<{ value: Mode; label: string }> = [
  { value: "random", label: "Casuale" },
  { value: "passphrase", label: "Frase di parole" },
  { value: "pronounceable", label: "Pronunciabile" },
  { value: "pin", label: "PIN" },
  { value: "token", label: "Token" },
];

const SEPARATORS = [
  { value: "-", label: "trattino -" },
  { value: " ", label: "spazio" },
  { value: ".", label: "punto ." },
  { value: "_", label: "underscore _" },
];

export default function PasswordGenerator() {
  const u = useUi();
  const [mode, setMode] = useState<Mode>("random");
  const [length, setLength] = useState(16);
  const [enabled, setEnabled] = useState<Record<SetKey, boolean>>({ upper: true, lower: true, digits: true, symbols: true });
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [words, setWords] = useState(6);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(false);
  const [withNumber, setWithNumber] = useState(true);
  const [syllableLength, setSyllableLength] = useState(12);
  const [pinLength, setPinLength] = useState(6);
  const [tokenBytes, setTokenBytes] = useState(32);
  const [tokenFormat, setTokenFormat] = useState<TokenFormat>("hex");
  const [password, setPassword] = useState("");

  const active = useMemo(() => (Object.keys(SETS) as SetKey[]).filter((k) => enabled[k]), [enabled]);
  const usable = mode !== "random" || active.length > 0;

  const regenerate = useCallback(() => {
    switch (mode) {
      case "random": return setPassword(generate(length, active, excludeSimilar));
      case "passphrase": return setPassword(passphrase({ words, separator, capitalize, number: withNumber }));
      case "pronounceable": return setPassword(pronounceable(syllableLength, capitalize));
      case "pin": return setPassword(pin(pinLength));
      case "token": return setPassword(token(tokenBytes, tokenFormat));
    }
  }, [mode, length, active, excludeSimilar, words, separator, capitalize, withNumber, syllableLength, pinLength, tokenBytes, tokenFormat]);
  useEffect(regenerate, [regenerate]);

  // Entropy estimate: bits an attacker has to guess, given how the value was drawn.
  const poolSize = active.reduce((sum, k) => sum + (excludeSimilar ? SETS[k].chars.replace(SIMILAR, "") : SETS[k].chars).length, 0);
  const entropy = {
    random: poolSize > 1 ? length * Math.log2(poolSize) : 0,
    passphrase: words * PASSPHRASE_BITS_PER_WORD + (withNumber ? Math.log2(100) : 0),
    pronounceable: PRONOUNCEABLE_BITS(syllableLength),
    pin: pinLength * Math.log2(10),
    token: tokenBytes * 8,
  }[mode];
  const strength = [...STRENGTH].reverse().find((s) => entropy >= s.min) ?? STRENGTH[0];

  return (
    <Stack>
      <Chips value={mode} onChange={setMode} options={MODES} />

      <Panel className="flex items-center justify-between gap-3">
        <div className={cx("font-mono text-lg break-all select-all min-w-0", u.text)}>{password || "—"}</div>
        <div className="flex shrink-0">
          <IconButton onClick={regenerate} disabled={!usable} title="Rigenera">
            <RotateCw className="w-4 h-4" />
          </IconButton>
          <CopyButton text={password} label="Copia password" />
        </div>
      </Panel>

      {!usable && <Notice tone="warn">Seleziona almeno un tipo di carattere.</Notice>}

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
          <div className={cx("h-full transition-all duration-300", strength.bar)} style={{ width: usable ? strength.width : "0%" }} />
        </div>
      </div>

      {mode === "random" && (
        <>
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
        </>
      )}

      {mode === "passphrase" && (
        <>
          <Slider label="Numero di parole" value={words} min={3} max={10} onChange={setWords} />
          <Field label="Separatore"><Chips value={separator} onChange={setSeparator} options={SEPARATORS} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Panel className="p-2.5"><Toggle checked={capitalize} onChange={setCapitalize} label="Iniziali maiuscole" /></Panel>
            <Panel className="p-2.5"><Toggle checked={withNumber} onChange={setWithNumber} label="Aggiungi un numero" /></Panel>
          </div>
          <Notice>Parole comuni italiane, facili da ricordare e da dettare. Ogni parola aggiunge circa 8 bit: servono 8-10 parole per arrivare a una robustezza alta.</Notice>
        </>
      )}

      {mode === "pronounceable" && (
        <>
          <Slider label="Lunghezza" value={syllableLength} min={6} max={32} onChange={setSyllableLength} />
          <Panel className="p-2.5"><Toggle checked={capitalize} onChange={setCapitalize} label="Iniziale maiuscola" /></Panel>
          <Notice>Consonanti e vocali alternate: si legge ad alta voce, ma a parità di lunghezza è meno robusta di una password casuale.</Notice>
        </>
      )}

      {mode === "pin" && (
        <>
          <Slider label="Cifre" value={pinLength} min={4} max={12} onChange={setPinLength} />
          <Notice tone="warn">Un PIN è corto per natura: usalo solo dove i tentativi sono limitati (bancomat, telefono).</Notice>
        </>
      )}

      {mode === "token" && (
        <>
          <Slider label="Byte casuali" value={tokenBytes} min={8} max={64} onChange={setTokenBytes} />
          <Field label="Formato"><Chips value={tokenFormat} onChange={setTokenFormat} options={[{ value: "hex", label: "Esadecimale" }, { value: "base64url", label: "Base64 URL-safe" }]} /></Field>
          <Notice>Adatto a chiavi API, segreti e identificatori: puro valore casuale, senza parole.</Notice>
        </>
      )}
    </Stack>
  );
}
