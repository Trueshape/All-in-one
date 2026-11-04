import { useState } from "react";
import { Segmented, Stack } from "../ui/kit";
import CurrencyConverter from "./CurrencyConverter";
import UnitConverter from "./UnitConverter";
import DataSizeConverter from "./DataSizeConverter";

type Tab = "currency" | "unit" | "data";

/** Both tabs stay mounted and the inactive one is hidden, so state (a running timer, a typed value) survives a tab switch. */
export default function MeasureConverters() {
  const [tab, setTab] = useState<Tab>("currency");

  return (
    <Stack>
      <Segmented
        fill
        value={tab}
        onChange={setTab}
        options={[{ value: "currency", label: "Valute" }, { value: "unit", label: "Unità di misura" }, { value: "data", label: "Dati" }]}
      />
      <div hidden={tab !== "currency"}><CurrencyConverter /></div>
      <div hidden={tab !== "unit"}><UnitConverter /></div>
      <div hidden={tab !== "data"}><DataSizeConverter /></div>
    </Stack>
  );
}
