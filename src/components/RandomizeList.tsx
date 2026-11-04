import { useState } from "react";
import { Shuffle, Trash2 } from "lucide-react";
import { Field, TextArea, TextInput, Button, CopyButton, Toggle, Stack } from "../ui/kit";
import { shuffle } from "../lib/textTools";

const lines = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/** Shuffles one item per line; "Prendi solo" keeps the first N of the shuffled list (a random draw). */
export default function RandomizeList() {
  const [input, setInput] = useState("Anna\nBruno\nChiara\nDavide\nElena");
  const [output, setOutput] = useState("");
  const [take, setTake] = useState("");
  const [numbered, setNumbered] = useState(false);
  const count = lines(input).length;

  const run = () => {
    const limit = Number(take);
    let items = shuffle(lines(input));
    if (Number.isInteger(limit) && limit > 0) items = items.slice(0, limit);
    setOutput(items.map((item, i) => (numbered ? `${i + 1}. ${item}` : item)).join("\n"));
  };

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={`Elenco · ${count} voci`} actions={<Button size="sm" variant="danger" disabled={!input} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => { setInput(""); setOutput(""); }}>Svuota</Button>}>
          <TextArea rows={10} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Una voce per riga..." />
        </Field>
        <Field label="Elenco mescolato" actions={<CopyButton text={output} />}>
          <TextArea rows={10} readOnly value={output} placeholder="Premi Mescola" />
        </Field>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Prendi solo i primi">
          <TextInput className="w-28" type="number" inputMode="numeric" min={1} max={count || undefined} value={take} onChange={(e) => setTake(e.target.value)} placeholder="Tutti" />
        </Field>
        <Toggle checked={numbered} onChange={setNumbered} label="Numera" />
        <Button variant="primary" disabled={count === 0} icon={<Shuffle className="w-4 h-4" />} onClick={run}>Mescola</Button>
      </div>
    </Stack>
  );
}
