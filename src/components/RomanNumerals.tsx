import { useState } from "react";
import { Field, TextInput, CopyButton, Notice, Stack } from "../ui/kit";
import { MAX_ROMAN, fromRoman, toRoman } from "../lib/roman";

/** Two linked fields: whichever one you type in, the other shows the conversion. */
export default function RomanNumerals() {
  const [arabic, setArabic] = useState("2026");
  const [roman, setRoman] = useState("MMXXVI");
  const [error, setError] = useState<string | null>(null);

  const changeArabic = (value: string) => {
    setArabic(value);
    if (value.trim() === "") {
      setRoman("");
      setError(null);
      return;
    }
    const r = toRoman(Number(value));
    setRoman(r ?? "");
    setError(r ? null : `Inserisci un numero intero da 1 a ${MAX_ROMAN}.`);
  };
  const changeRoman = (value: string) => {
    setRoman(value);
    if (value.trim() === "") {
      setArabic("");
      setError(null);
      return;
    }
    const n = fromRoman(value);
    setArabic(n === null ? "" : String(n));
    setError(n === null ? "Numero romano non valido: usa I, V, X, L, C, D, M nella forma corretta." : null);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Numero">
          <div className="flex gap-2 items-center">
            <TextInput type="number" inputMode="numeric" min={1} max={MAX_ROMAN} value={arabic} onChange={(e) => changeArabic(e.target.value)} />
            <CopyButton text={arabic} />
          </div>
        </Field>
        <Field label="Numero romano">
          <div className="flex gap-2 items-center">
            <TextInput className="font-mono uppercase" value={roman} onChange={(e) => changeRoman(e.target.value)} />
            <CopyButton text={roman} />
          </div>
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <Notice>I numeri romani standard vanno da 1 a {MAX_ROMAN}. Scrivi in un campo: l'altro si aggiorna.</Notice>
    </Stack>
  );
}
