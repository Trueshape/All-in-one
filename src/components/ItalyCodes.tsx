import { CopyButton, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { LookupTable } from "../ui/LookupTable";
import type { LookupColumn } from "../ui/LookupTable";
import { searchProvinces } from "../lib/italyCodes";
import type { Province } from "../lib/italyCodes";

const digitsOf = (s: string) => s.replace(/\D/g, "");

/** Lookup table of the Italian provinces: sigla, region, telephone prefix and CAP of the capoluogo. */
export default function ItalyCodes() {
  const u = useUi();
  const columns: LookupColumn<Province>[] = [
    { key: "sigla", label: "Sigla", value: (p) => p.sigla, render: (p) => <span className={cx("font-mono font-bold", u.accent)}>{p.sigla}</span> },
    { key: "name", label: "Provincia", value: (p) => p.name, render: (p) => p.name },
    { key: "region", label: "Regione", value: (p) => p.region, render: (p) => <span className={u.muted}>{p.region}</span> },
    { key: "prefix", label: "Prefisso", value: (p) => digitsOf(p.prefix.split(" / ")[0]), digits: true, render: (p) => <span className="font-mono">{p.prefix}</span> },
    { key: "cap", label: "CAP capoluogo", value: (p) => digitsOf(p.cap.split(/[ –]/)[0]), digits: true, render: (p) => <span className="font-mono whitespace-nowrap">{p.cap}</span> },
  ];

  return (
    <Stack>
      <LookupTable
        rows={searchProvinces}
        columns={columns}
        rowKey={(p) => p.sigla}
        placeholder="Nome, sigla, regione, prefisso o CAP"
        defaultSort="name"
        tieBreak={(p) => p.name}
        actions={(p) => <CopyButton text={p.sigla} label="Copia la sigla" />}
      />
      <Notice>Dati di riferimento: per usi ufficiali verifica sulle fonti ufficiali (ISTAT, Poste Italiane, AGCOM). I prefissi telefonici e i CAP sono quelli del capoluogo (due, separati da "/", per le province con due sedi); le città grandi hanno più CAP. Clicca il titolo di una colonna per ordinare (di nuovo per invertire).</Notice>
    </Stack>
  );
}
