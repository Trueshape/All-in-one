import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { ImagePlus } from "lucide-react";
import { cx } from "./kit";
import { useUi } from "./tokens";

export interface Source {
  url: string;
  name: string;
  type: string;
  width: number;
  height: number;
  size: number;
  image: HTMLImageElement;
}

/** Loads one image file and keeps its object URL alive only while it is in use. */
export function useImageSource() {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);

  const load = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Il file selezionato non è un'immagine.");
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      setSource({ url, image, name: file.name.replace(/\.[^.]+$/, "") || "immagine", type: file.type, width: image.naturalWidth, height: image.naturalHeight, size: file.size });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Impossibile leggere l'immagine (formato non supportato da questo browser).");
    };
    image.src = url;
  };

  const clear = () => {
    setSource(null);
    setError(null);
  };

  return { source, error, setError, load, clear };
}

export type ImageSourceState = ReturnType<typeof useImageSource>;

export function ImageDrop({ onFile, hint = "PNG, JPG, WEBP, GIF, BMP, AVIF" }: { onFile: (file: File | undefined) => void; hint?: string }) {
  const u = useUi();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onFile(e.dataTransfer.files?.[0]);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFile(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx("w-full h-56 flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-colors", u.divider, u.muted, dragging && u.accent, u.id === "sophisticated" && "rounded-2xl")}
      >
        <ImagePlus className="w-7 h-7" />
        <span className={cx("text-xs font-semibold", u.text)}>Seleziona o trascina un'immagine</span>
        <span className="text-[11px]">{hint}</span>
      </button>
      <input ref={input} type="file" accept="image/*" onChange={onChange} className="hidden" />
    </>
  );
}
