import { useMemo, useState } from "react";
import { TextInput, Segmented, CopyButton, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { DIAL_CODES, PROVINCES, formatDial, searchDial, searchProvinces } from "../lib/italyCodes";
import type { DialCode, Province } from "../lib/italyCodes";

type Tab = "province" | "dial";
type Dir = "asc" | "desc";

interface Column<T> {
  key: string;
  label: string;
  /** Text to sort by. */
  value: (row: T) => string;
  /** Digit strings compare character by character, which is also the order you would dial them in. */
  digits?: boolean;
  /** Width class for the column, when it should not take the spare space. */
  width?: string;
}

const digitsOf = (s: string) => s.replace(/\D/g, "");

const PROVINCE_COLUMNS: Column<Province>[] = [
  { key: "sigla", label: "Sigla", value: (p) => p.sigla },
  { key: "name", label: "Provincia", value: (p) => p.name },
  { key: "region", label: "Regione", value: (p) => p.region },
  { key: "prefix", label: "Prefisso", value: (p) => digitsOf(p.prefix.split(" / ")[0]), digits: true },
  { key: "cap", label: "CAP capoluogo", value: (p) => digitsOf(p.cap.split(/[ –]/)[0]), digits: true },
];
const DIAL_COLUMNS: Column<DialCode>[] = [
  { key: "iso", label: "ISO", value: (d) => d.iso },
  { key: "country", label: "Paese", value: (d) => d.country, width: "w-60" },
  { key: "code", label: "Prefisso", value: (d) => digitsOf(d.codes[0]), digits: true },
];

function sortRows<T>(rows: T[], column: Column<T>, dir: Dir, tieBreak: (row: T) => string): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = column.value(a);
    const y = column.value(b);
    const order = column.digits ? (x < y ? -1 : x > y ? 1 : 0) : x.localeCompare(y, "it");
    return order * sign || tieBreak(a).localeCompare(tieBreak(b), "it");
  });
}

/** Lookup tables: Italian provinces (sigla, telephone prefix, CAP) and international dialing codes. Click a column title to sort by it. */
export default function ItalyCodes() {
  const u = useUi();
  const [tab, setTab] = useState<Tab>("province");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: Dir }>({ key: "name", dir: "asc" });

  const provinces = useMemo(() => {
    const column = PROVINCE_COLUMNS.find((c) => c.key === sort.key) ?? PROVINCE_COLUMNS[1];
    return sortRows(searchProvinces(query), column, sort.dir, (p) => p.name);
  }, [query, sort]);
  const dials = useMemo(() => {
    const column = DIAL_COLUMNS.find((c) => c.key === sort.key) ?? DIAL_COLUMNS[0];
    return sortRows(searchDial(query), column, sort.dir, (d) => d.country);
  }, [query, sort]);

  const cell = "px-3 py-1.5";
  const columns = tab === "province" ? PROVINCE_COLUMNS : DIAL_COLUMNS;
  const toggle = (key: string) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-stretch gap-3">
        <Segmented
          fill
          className="h-full"
          value={tab}
          onChange={(v) => { setTab(v); setQuery(""); setSort({ key: v === "province" ? "name" : "country", dir: "asc" }); }}
          options={[
            { value: "province", label: <span className="whitespace-nowrap">{`Province (${PROVINCES.length})`}</span> },
            { value: "dial", label: <span className="whitespace-nowrap">{`Prefissi esteri (${DIAL_CODES.length})`}</span> },
          ]}
        />
        <TextInput className="h-full" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "province" ? "Nome, sigla, regione, prefisso o CAP" : "Paese, sigla ISO o prefisso (+39)"} aria-label="Cerca" />
      </div>

      <div className={cx("overflow-auto max-h-[52vh] border", u.divider)}>
        <table className="w-full text-sm">
          <thead className={u.id === "sophisticated" ? "bg-black/40 backdrop-blur" : "bg-black/60"}>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cx("sticky top-0 p-0 text-left", c.width)} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                  <button
                    type="button"
                    onClick={() => toggle(c.key)}
                    title={`Ordina per ${c.label.toLowerCase()}`}
                    className={cx("w-full flex items-center gap-1 px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold cursor-pointer whitespace-nowrap hover:text-zinc-200", sort.key === c.key ? u.accent : u.muted)}
                  >
                    {c.label}
                  </button>
                </th>
              ))}
              <th className="sticky top-0" />
            </tr>
          </thead>
          <tbody>
            {tab === "province"
              ? provinces.map((p) => (
                  <tr key={p.sigla} className={cx("border-t", u.divider)}>
                    <td className={cx(cell, "font-mono font-bold", u.accent)}>{p.sigla}</td>
                    <td className={cell}>{p.name}</td>
                    <td className={cx(cell, u.muted)}>{p.region}</td>
                    <td className={cx(cell, "font-mono")}>{p.prefix}</td>
                    <td className={cx(cell, "font-mono whitespace-nowrap")}>{p.cap}</td>
                    <td className={cell}><CopyButton text={p.sigla} label="Copia la sigla" /></td>
                  </tr>
                ))
              : dials.map((d) => (
                  <tr key={d.iso} className={cx("border-t", u.divider)}>
                    <td className={cx(cell, "font-mono font-bold", u.accent)}>{d.iso}</td>
                    <td className={cx(cell, "w-60")}>{d.country}</td>
                    <td className={cx(cell, "font-mono")}>{d.codes.map(formatDial).join(", ")}</td>
                    <td className={cell}><CopyButton text={formatDial(d.codes[0])} label="Copia il prefisso" /></td>
                  </tr>
                ))}
          </tbody>
        </table>
        {(tab === "province" ? provinces : dials).length === 0 && <p className={cx("p-8 text-center text-sm", u.muted)}>Nessun risultato.</p>}
      </div>
      <Notice>Dati di riferimento: per usi ufficiali verifica sulle fonti ufficiali (ISTAT, Poste Italiane, AGCOM). I prefissi telefonici e i CAP sono quelli del capoluogo (due, separati da "/", per le province con due sedi); le città grandi hanno più CAP. Clicca il titolo di una colonna per ordinare (di nuovo per invertire).</Notice>
    </Stack>
  );
}
