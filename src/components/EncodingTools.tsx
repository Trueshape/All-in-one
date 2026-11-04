import { useState } from "react";
import { Segmented, Stack } from "../ui/kit";
import TextCodes from "./TextCodes";
import MorseCode from "./MorseCode";
import RomanNumerals from "./RomanNumerals";

type Tab = "codes" | "morse" | "roman";

/** Both directions of each code, one tab per code. All tabs stay mounted, so what you typed survives a tab switch. */
export default function EncodingTools() {
  const [tab, setTab] = useState<Tab>("codes");

  return (
    <Stack>
      <Segmented fill value={tab} onChange={setTab} options={[{ value: "codes", label: "Binario e altri" }, { value: "morse", label: "Morse" }, { value: "roman", label: "Numeri romani" }]} />
      <div hidden={tab !== "codes"}><TextCodes /></div>
      <div hidden={tab !== "morse"}><MorseCode /></div>
      <div hidden={tab !== "roman"}><RomanNumerals /></div>
    </Stack>
  );
}
