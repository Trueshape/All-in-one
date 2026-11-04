import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, TextArea, Button, CopyButton, Notice, Stack } from "../ui/kit";
import { morseToText, textToMorse } from "../lib/morse";

/** Two linked boxes: whichever one you type in, the other shows the conversion. */
export default function MorseCode() {
  const [text, setText] = useState("SOS Ciao");
  const [code, setCode] = useState(() => textToMorse("SOS Ciao").code);
  const [note, setNote] = useState<string | null>(null);

  const changeText = (value: string) => {
    const { code: next, skipped } = textToMorse(value);
    setText(value);
    setCode(next);
    setNote(skipped ? `${skipped} caratteri senza codice Morse sono stati saltati.` : null);
  };
  const changeCode = (value: string) => {
    const { text: next, unknown } = morseToText(value);
    setCode(value);
    setText(next);
    setNote(unknown ? `${unknown} gruppi non riconosciuti, mostrati come "?".` : null);
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Testo">
          <div className="space-y-2">
            <TextArea rows={8} value={text} onChange={(e) => changeText(e.target.value)} placeholder="Scrivi o incolla il testo..." />
            <div className="flex gap-2">
              <CopyButton text={text} />
              <Button size="sm" variant="danger" disabled={!text && !code} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => changeText("")}>Svuota</Button>
            </div>
          </div>
        </Field>
        <Field label="Codice Morse">
          <div className="space-y-2">
            <TextArea rows={8} value={code} onChange={(e) => changeCode(e.target.value)} className="font-mono" placeholder="Oppure incolla il Morse da decodificare..." />
            <div className="flex gap-2">
              <CopyButton text={code} />
            </div>
          </div>
        </Field>
      </div>
      {note && <Notice tone="warn">{note}</Notice>}
      <Notice>Le lettere sono separate da uno spazio, le parole da " / ". Le lettere accentate perdono l'accento (è diventa E).</Notice>
    </Stack>
  );
}
