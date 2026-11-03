import { useState } from "react";
import { Segmented, Stack } from "../ui/kit";
import { useImageSource } from "../ui/ImageDrop";
import ImageConverter from "./ImageConverter";
import ImageResizer from "./ImageResizer";
import ImageUpscaler from "./ImageUpscaler";

type Tab = "convert" | "resize" | "upscale";

/** Convert, resize and enlarge share one loaded image: pick it once, then switch tab. */
export default function ImageTools() {
  const image = useImageSource();
  const [tab, setTab] = useState<Tab>("convert");

  return (
    <Stack>
      <Segmented
        fill
        value={tab}
        onChange={setTab}
        options={[{ value: "convert", label: "Converti" }, { value: "resize", label: "Ridimensiona" }, { value: "upscale", label: "Ingrandisci" }]}
      />
      {tab === "convert" && <ImageConverter image={image} />}
      {tab === "resize" && <ImageResizer image={image} />}
      {tab === "upscale" && <ImageUpscaler image={image} />}
    </Stack>
  );
}
