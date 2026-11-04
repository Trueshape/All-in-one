import { CopyButton, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { LookupTable } from "../ui/LookupTable";
import type { LookupColumn } from "../ui/LookupTable";
import { formatDial, searchDial } from "../lib/italyCodes";
import type { DialCode } from "../lib/italyCodes";

/** Lookup table of the international calling codes: ISO code, country and prefix. */
export default function DialCodes() {
  const u = useUi();
  const columns: LookupColumn<DialCode>[] = [
    { key: "iso", label: "ISO", value: (d) => d.iso, render: (d) => <span className={cx("font-mono font-bold", u.accent)}>{d.iso}</span> },
    { key: "country", label: "Paese", value: (d) => d.country, width: "w-px whitespace-nowrap", render: (d) => d.country },
    { key: "code", label: "Prefisso", value: (d) => d.codes[0].replace(/\D/g, ""), digits: true, render: (d) => <span className="font-mono">{d.codes.map(formatDial).join(", ")}</span> },
  ];

  return (
    <Stack>
      <LookupTable
        rows={searchDial}
        columns={columns}
        rowKey={(d) => d.iso}
        placeholder="Paese, sigla ISO o prefisso (+39)"
        defaultSort="country"
        tieBreak={(d) => d.country}
        actions={(d) => <CopyButton text={formatDial(d.codes[0])} label="Copia il prefisso" />}
      />
      <Notice>Prefissi internazionali secondo l'ITU. I Paesi del piano nordamericano condividono +1 e si distinguono per le cifre dopo (+1 242). Clicca il titolo di una colonna per ordinare (di nuovo per invertire).</Notice>
    </Stack>
  );
}
