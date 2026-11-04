import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { Field, TextArea, Select, Slider, Button, Notice, Stack } from "../ui/kit";
import { splitForSpeech } from "../lib/speech";

type Status = "idle" | "speaking" | "paused";

/** Reads the text aloud with the voices installed in the browser. Nothing is sent anywhere, and no audio file is produced. */
export default function TextToSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [text, setText] = useState("Ciao! Questo è un test della lettura ad alta voce.");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const run = useRef(0);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      // Italian voices first, then the rest by language and name.
      const list = [...speechSynthesis.getVoices()].sort((a, b) => Number(b.lang.startsWith("it")) - Number(a.lang.startsWith("it")) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
      setVoices(list);
      setVoiceUri((current) => current || list[0]?.voiceURI || "");
    };
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", load);
      run.current++;
      speechSynthesis.cancel();
    };
  }, [supported]);

  const chunks = useMemo(() => splitForSpeech(text), [text]);

  const speak = (index: number, id: number) => {
    if (id !== run.current) return;
    if (index >= chunks.length) {
      setStatus("idle");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    const voice = voices.find((v) => v.voiceURI === voiceUri);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.onend = () => speak(index + 1, id);
    utterance.onerror = (e) => {
      // "canceled" and "interrupted" are our own stop; anything else ends the reading.
      if (e.error !== "canceled" && e.error !== "interrupted" && id === run.current) setStatus("idle");
    };
    speechSynthesis.speak(utterance);
  };

  const start = () => {
    run.current++;
    speechSynthesis.cancel();
    setStatus("speaking");
    speak(0, run.current);
  };
  const stop = () => {
    run.current++;
    speechSynthesis.cancel();
    setStatus("idle");
  };
  const togglePause = () => {
    if (status === "speaking") {
      speechSynthesis.pause();
      setStatus("paused");
    } else {
      speechSynthesis.resume();
      setStatus("speaking");
    }
  };

  if (!supported) return <Notice tone="error">Questo browser non ha la lettura vocale.</Notice>;

  return (
    <Stack>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Testo"><TextArea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Scrivi o incolla il testo da leggere..." /></Field>
        <div className="space-y-4 min-w-0">
          <Field label="Voce">
            <Select value={voiceUri} onChange={(e) => setVoiceUri(e.target.value)} disabled={voices.length === 0}>
              {voices.length === 0 && <option value="">Nessuna voce disponibile</option>}
              {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
            </Select>
          </Field>
          <Slider label="Velocità" value={rate} min={0.5} max={2} step={0.1} onChange={setRate} display={`${rate.toFixed(1)}×`} />
          <Slider label="Tono" value={pitch} min={0.5} max={2} step={0.1} onChange={setPitch} display={pitch.toFixed(1)} />
          <Slider label="Volume" value={volume} min={0} max={1} step={0.05} onChange={setVolume} display={`${Math.round(volume * 100)}%`} />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={chunks.length === 0 || voices.length === 0} icon={<Play className="w-4 h-4" />} onClick={start}>Leggi</Button>
            <Button disabled={status === "idle"} icon={status === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />} onClick={togglePause}>{status === "paused" ? "Riprendi" : "Pausa"}</Button>
            <Button disabled={status === "idle"} icon={<Square className="w-4 h-4" />} onClick={stop}>Stop</Button>
          </div>
        </div>
      </div>
      <Notice>Le voci sono quelle del tuo dispositivo, quindi cambiano da browser a browser. Velocità, tono e volume valgono dal prossimo paragrafo. La lettura non si può salvare come file audio.</Notice>
    </Stack>
  );
}
