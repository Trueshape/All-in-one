import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, TextArea, Button, CopyButton, Segmented, Notice, Stack } from "../ui/kit";
import { BASES, codesToText, textToCodes } from "../lib/textCodes";
import type { Base } from "../lib/textCodes";

const ORDER: Base[] = [2, 16, 10, 8];
const SEPARATORS = [{ value: " ", label: "Spazio" }, { value: ",", label: "Virgola" }, { value: "\n", label: "A capo" }, { value: "", label: "Nessuno" }];

/** Two linked boxes: whichever one you type in, the other shows the conversion. */
export default function TextCodes() {
  const [base, setBase] = useState<Base>(2);
  const [separator, setSeparator] = useState(" ");
  const [text, setText] = useState("Ciao!");
  const [codes, setCodes] = useState(() => textToCodes("Ciao!", 2));
  const [error, setError] = useState<string | null>(null);

  const changeText = (value: string) => {
    setText(value);
    setCodes(textToCodes(value, base, separator));
    setError(null);
  };
  const changeCodes = (value: string) => {
    setCodes(value);
    const result = codesToText(value, base);
    if ("error" in result) setError(result.error);
    else {
      setText(result.text);
      setError(null);
    }
  };
  // Changing format or separator re-renders the codes from the text.
  const reformat = (nextBase: Base, nextSeparator: string) => {
    setBase(nextBase);
    setSeparator(nextSeparator);
    setCodes(textToCodes(text, nextBase, nextSeparator));
    setError(null);
  };
  const bytes = useMemo(() => new TextEncoder().encode(text).length, [text]);

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Formato">
          <Segmented fill value={base} onChange={(v) => reformat(v, separator)} options={ORDER.map((b) => ({ value: b, label: BASES[b].label }))} />
        </Field>
        <Field label="Separatore">
          <Segmented fill value={separator} onChange={(v) => reformat(base, v)} options={SEPARATORS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={`Testo · ${bytes} byte`}>
          <div className="space-y-2">
            <TextArea rows={8} value={text} onChange={(e) => changeText(e.target.value)} placeholder="Scrivi o incolla il testo..." />
            <div className="flex gap-2">
              <CopyButton text={text} />
              <Button size="sm" variant="danger" disabled={!text} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => { changeText(""); }}>Svuota</Button>
            </div>
          </div>
        </Field>
        <Field label={BASES[base].label}>
          <div className="space-y-2">
            <TextArea rows={8} value={codes} onChange={(e) => changeCodes(e.target.value)} className="font-mono" placeholder="Oppure incolla i codici da decodificare..." />
            <div className="flex gap-2">
              <CopyButton text={codes} />
            </div>
          </div>
        </Field>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Notice>
        Ogni carattere diventa uno o più byte UTF-8 (le lettere accentate e le emoji ne usano di più). Scrivi in uno dei due riquadri: l'altro si aggiorna. Per decodificare, i byte possono essere separati da spazi, virgole o a capo; in esadecimale va bene anche "0x48".
      </Notice>
    </Stack>
  );
}
