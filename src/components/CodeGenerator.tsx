import { useState } from "react";
import { Segmented, Stack } from "../ui/kit";
import QrGenerator from "./QrGenerator";
import BarcodeGenerator from "./BarcodeGenerator";

type Kind = "qr" | "barcode";

/** QR codes and barcodes share one tool: pick the kind, then fill its fields. */
export default function CodeGenerator() {
  const [kind, setKind] = useState<Kind>("qr");

  return (
    <Stack>
      <Segmented
        fill
        value={kind}
        onChange={setKind}
        options={[{ value: "qr", label: "QR code" }, { value: "barcode", label: "Codice a barre" }]}
      />
      {kind === "qr" ? <QrGenerator /> : <BarcodeGenerator />}
    </Stack>
  );
}
