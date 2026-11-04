import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TextInput, cx } from "./kit";
import { useUi } from "./tokens";

export interface LookupColumn<T> {
  key: string;
  label: string;
  /** Text to sort by. */
  value: (row: T) => string;
  /** Digit strings compare character by character, which is also the order you would dial them in. */
  digits?: boolean;
  /** Width class, when the column should fit its content instead of taking the spare space. */
  width?: string;
  render: (row: T) => ReactNode;
}

type Dir = "asc" | "desc";

/** A searchable table whose column titles sort it (click again to reverse). The titles stay opaque on top while the rows scroll. */
export function LookupTable<T>({
  rows,
  columns,
  rowKey,
  search,
  placeholder,
  defaultSort,
  tieBreak,
  actions,
}: {
  rows: (query: string) => T[];
  columns: LookupColumn<T>[];
  rowKey: (row: T) => string;
  placeholder: string;
  defaultSort: string;
  tieBreak: (row: T) => string;
  /** Last cell of each row, usually a copy button. */
  actions: (row: T) => ReactNode;
}) {
  const u = useUi();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: Dir }>({ key: defaultSort, dir: "asc" });

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort.key) ?? columns[0];
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...rows(query)].sort((a, b) => {
      const x = column.value(a);
      const y = column.value(b);
      const order = column.digits ? (x < y ? -1 : x > y ? 1 : 0) : x.localeCompare(y, "it");
      return order * sign || tieBreak(a).localeCompare(tieBreak(b), "it");
    });
    // The callers' columns, rows and tie-break give the same result for a given query and sort, so only those two matter here.
  }, [query, sort]);

  const toggle = (key: string) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  // Opaque, so rows scrolling underneath the sticky titles do not show through.
  const headBg = u.id === "immersive" ? "bg-[#02050a]" : u.id === "sophisticated" ? "bg-slate-950" : "bg-zinc-950";
  const cell = "px-3 py-1.5";

  return (
    <>
      <TextInput className="h-11" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} aria-label="Cerca" />
      <div className={cx("overflow-auto max-h-[52vh] border", u.divider)}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cx("sticky top-0 z-10 p-0 text-left", headBg, c.width)} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                  <button
                    type="button"
                    onClick={() => toggle(c.key)}
                    title={`Ordina per ${c.label.toLowerCase()}`}
                    className={cx("w-full px-3 py-2 text-left text-[10px] uppercase tracking-wider font-semibold cursor-pointer whitespace-nowrap hover:text-zinc-200", sort.key === c.key ? u.accent : u.muted)}
                  >
                    {c.label}
                  </button>
                </th>
              ))}
              <th className={cx("sticky top-0 z-10", headBg)} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={rowKey(row)} className={cx("border-t", u.divider)}>
                {columns.map((c) => (
                  <td key={c.key} className={cx(cell, c.width)}>{c.render(row)}</td>
                ))}
                <td className={cell}>{actions(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <p className={cx("p-8 text-center text-sm", u.muted)}>Nessun risultato.</p>}
      </div>
    </>
  );
}
