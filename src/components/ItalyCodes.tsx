import { useMemo, useState } from "react";
import { Field, TextInput, Segmented, CopyButton, Notice, Stack, cx } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { DIAL_CODES, PROVINCES, searchDial, searchProvinces } from "../lib/italyCodes";

type Tab = "province" | "dial";

/** Lookup tables: Italian provinces (sigla, telephone prefix, CAP) and international dialing codes. */
export default function ItalyCodes() {
  const u = useUi();
  const [tab, setTab] = useState<Tab>("province");
  const [query, setQuery] = useState("");

  const provinces = useMemo(() => searchProvinces(query), [query]);
  const dials = useMemo(() => searchDial(query), [query]);
  const head = cx("text-left text-[10px] uppercase tracking-wider font-semibold px-3 py-2 sticky top-0", u.muted);
  const cell = "px-3 py-1.5";

  return (
    <Stack>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Segmented fill value={tab} onChange={(v) => { setTab(v); setQuery(""); }} options={[{ value: "province", label: `Province (${PROVINCES.length})` }, { value: "dial", label: `Prefissi esteri (${DIAL_CODES.length})` }]} />
        <Field>
          <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "province" ? "Nome, sigla, regione, prefisso o CAP" : "Paese, sigla ISO o prefisso (+39)"} aria-label="Cerca" />
        </Field>
      </div>

      <div className={cx("overflow-auto max-h-[52vh] border", u.divider)}>
        <table className="w-full text-sm">
          <thead className={u.id === "sophisticated" ? "bg-black/40 backdrop-blur" : "bg-black/60"}>
            {tab === "province" ? (
              <tr><th className={head}>Sigla</th><th className={head}>Provincia</th><th className={head}>Regione</th><th className={head}>Prefisso</th><th className={head}>CAP capoluogo</th><th className={head} /></tr>
            ) : (
              <tr><th className={head}>Paese</th><th className={head}>ISO</th><th className={head}>Prefisso</th><th className={head} /></tr>
            )}
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
                    <td className={cell}>{d.country}</td>
                    <td className={cx(cell, "font-mono", u.muted)}>{d.iso}</td>
                    <td className={cx(cell, "font-mono font-bold", u.accent)}>+{d.code}</td>
                    <td className={cell}><CopyButton text={`+${d.code}`} label="Copia il prefisso" /></td>
                  </tr>
                ))}
          </tbody>
        </table>
        {(tab === "province" ? provinces : dials).length === 0 && <p className={cx("p-8 text-center text-sm", u.muted)}>Nessun risultato.</p>}
      </div>
      <Notice>Dati di riferimento: per usi ufficiali verifica sulle fonti ufficiali (ISTAT, Poste Italiane, AGCOM). I prefissi telefonici e i CAP sono quelli del capoluogo (due, separati da "/", per le province con due sedi); le città grandi hanno più CAP.</Notice>
    </Stack>
  );
}
