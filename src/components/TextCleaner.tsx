import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Field, TextArea, TextInput, Button, CopyButton, Segmented, Toggle, Notice, Stack } from "../ui/kit";
import { dedupeLines, findReplace } from "../lib/textTools";

type Mode = "replace" | "dedupe";

/** Find and replace, or remove duplicate lines. The result updates as you type. */
export default function TextCleaner() {
  const [mode, setMode] = useState<Mode>("replace");
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [trim, setTrim] = useState(true);
  const [skipEmpty, setSkipEmpty] = useState(false);

  const out = useMemo(() => {
    if (mode === "replace") {
      const r = findReplace(text, find, replacement, { caseSensitive, wholeWord, regex });
      return "error" in r ? { result: "", error: r.error, info: "" } : { result: r.result, error: null, info: find ? `${r.count} sostituzioni` : "" };
    }
    const r = dedupeLines(text, { caseSensitive, trim, skipEmpty });
    return { result: r.result, error: null, info: `${r.removed} righe rimosse` };
  }, [mode, text, find, replacement, caseSensitive, wholeWord, regex, trim, skipEmpty]);

  return (
    <Stack>
      <Segmented fill value={mode} onChange={setMode} options={[{ value: "replace", label: "Trova e sostituisci" }, { value: "dedupe", label: "Righe duplicate" }]} />

      {mode === "replace" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Trova"><TextInput value={find} onChange={(e) => setFind(e.target.value)} /></Field>
          <Field label="Sostituisci con"><TextInput value={replacement} onChange={(e) => setReplacement(e.target.value)} /></Field>
        </div>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Toggle checked={caseSensitive} onChange={setCaseSensitive} label="Maiuscole/minuscole" />
        {mode === "replace" ? (
          <>
            <Toggle checked={wholeWord} onChange={setWholeWord} label="Parola intera" />
            <Toggle checked={regex} onChange={setRegex} label="Espressione regolare" />
          </>
        ) : (
          <>
            <Toggle checked={trim} onChange={setTrim} label="Ignora spazi ai bordi" />
            <Toggle checked={skipEmpty} onChange={setSkipEmpty} label="Rimuovi righe vuote" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Testo" actions={<Button size="sm" variant="danger" disabled={!text} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setText("")}>Svuota</Button>}>
          <TextArea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Incolla il testo..." />
        </Field>
        <Field label={out.info ? `Risultato · ${out.info}` : "Risultato"} actions={<CopyButton text={out.result} />}>
          <TextArea rows={10} readOnly value={out.result} />
        </Field>
      </div>
      {out.error && <Notice tone="error">{out.error}</Notice>}
    </Stack>
  );
}
