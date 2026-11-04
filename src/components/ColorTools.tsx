import { useState } from "react";
import { Segmented, Stack } from "../ui/kit";
import ColorPicker from "./ColorPicker";
import ColorExtractor from "./ColorExtractor";

type Tab = "palette" | "image";

/** Both tabs stay mounted and the inactive one is hidden, so the chosen color and the loaded image survive a tab switch. */
export default function ColorTools() {
  const [tab, setTab] = useState<Tab>("palette");

  return (
    <Stack>
      <Segmented fill value={tab} onChange={setTab} options={[{ value: "palette", label: "Tavolozza" }, { value: "image", label: "Da immagine" }]} />
      <div hidden={tab !== "palette"}><ColorPicker /></div>
      <div hidden={tab !== "image"}><ColorExtractor /></div>
    </Stack>
  );
}
