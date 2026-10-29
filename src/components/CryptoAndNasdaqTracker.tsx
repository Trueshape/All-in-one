import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Coins, RefreshCw, Search } from "lucide-react";
import { Segmented, Chips, Button, IconButton, TextInput, Panel, Notice, SectionTitle, Stack, cx, fmtNumber } from "../ui/kit";
import { useUi } from "../ui/tokens";
import { FALLBACK_CRYPTO, NASDAQ_STOCKS } from "../lib/marketData";
import type { CryptoCoin } from "../lib/marketData";

type Tab = "crypto" | "nasdaq";
type Filter = "all" | "gainers" | "losers" | "volume";
type Source = "reference" | "loading" | "live" | "error";

const COINGECKO = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d";

function Sparkline({ prices, up }: { prices: number[]; up: boolean }) {
  if (prices.length < 2) return <span className="text-[10px] opacity-50">–</span>;
  const min = Math.min(...prices);
  const range = Math.max(...prices) - min || 1;
  const d = prices.map((p, i) => `${i ? "L" : "M"}${((i / (prices.length - 1)) * 80).toFixed(1)},${(22 - ((p - min) / range) * 20).toFixed(1)}`).join(" ");
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={up ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Change({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={cx("inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-bold", up ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10")}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default function CryptoAndNasdaqTracker() {
  const u = useUi();
  const [tab, setTab] = useState<Tab>("crypto");
  const [currency, setCurrency] = useState<"usd" | "eur">("usd");
  const [eurRate, setEurRate] = useState(0.92);
  const [coins, setCoins] = useState<CryptoCoin[]>(FALLBACK_CRYPTO);
  const [source, setSource] = useState<Source>("reference");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<CryptoCoin | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setSource("loading");
    try {
      const res = await fetch(COINGECKO, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error("Dati non validi");
      setCoins(data);
      setUpdatedAt(new Date());
      setSource("live");
    } catch {
      if (signal?.aborted) return;
      setCoins(FALLBACK_CRYPTO);
      setSource("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    fetch("https://open.er-api.com/v6/latest/USD", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => { if (d?.rates?.EUR) setEurRate(d.rates.EUR); })
      .catch(() => {});
    return () => controller.abort();
  }, [load]);

  const symbol = currency === "eur" ? "€" : "$";
  const rate = currency === "eur" ? eurRate : 1;

  const price = (usd: number) => {
    const v = usd * rate;
    const digits = v >= 1000 ? 2 : v >= 1 ? 2 : v >= 0.01 ? 4 : 6;
    return `${symbol}${v.toLocaleString("it-IT", { minimumFractionDigits: digits === 2 ? 2 : 0, maximumFractionDigits: digits })}`;
  };

  const compact = (usd: number) => {
    const v = usd * rate;
    if (v >= 1e12) return `${symbol}${fmtNumber(v / 1e12)}T`;
    if (v >= 1e9) return `${symbol}${fmtNumber(v / 1e9)}B`;
    if (v >= 1e6) return `${symbol}${fmtNumber(v / 1e6)}M`;
    return `${symbol}${fmtNumber(v, 0)}`;
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coins.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.symbol.toLowerCase().includes(q)) return false;
      if (filter === "gainers") return c.price_change_percentage_24h > 0;
      if (filter === "losers") return c.price_change_percentage_24h < 0;
      if (filter === "volume") return c.total_volume > 1e9;
      return true;
    });
  }, [coins, query, filter]);

  const statusText = {
    reference: "Dati di riferimento non aggiornati",
    loading: "Aggiornamento in corso…",
    live: `Dati live CoinGecko · ${updatedAt?.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
    error: "Servizio non disponibile: dati di riferimento non aggiornati",
  }[source];

  const th = cx("py-2 px-3 font-medium text-left", u.statLabel);
  const td = "py-2.5 px-3";

  return (
    <Stack>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "crypto", label: <span className="inline-flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Crypto</span> },
            { value: "nasdaq", label: <span className="inline-flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> NASDAQ</span> },
          ]}
        />
        <div className="flex items-center gap-2">
          <Segmented value={currency} onChange={setCurrency} options={[{ value: "usd", label: "USD" }, { value: "eur", label: "EUR" }]} />
          <IconButton onClick={() => load()} disabled={source === "loading"} title="Aggiorna dati"><RefreshCw className={cx("w-4 h-4", source === "loading" && "animate-spin")} /></IconButton>
        </div>
      </div>

      {tab === "crypto" ? (
        <div className="space-y-4">
          <p className={cx("text-xs", source === "error" ? "text-amber-400" : u.muted)}>{statusText}</p>
          {source === "error" && <Notice tone="warn">L'API pubblica di CoinGecko ha un limite di richieste: riprova tra qualche minuto.</Notice>}

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div className="relative">
              <Search className={cx("w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none", u.muted)} />
              <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per nome o simbolo (es. Bitcoin, ETH)" className="pl-9" />
            </div>
            <Chips value={filter} onChange={setFilter} options={[
              { value: "all", label: "Tutte" },
              { value: "gainers", label: "In rialzo" },
              { value: "losers", label: "In ribasso" },
              { value: "volume", label: "Volume > 1B" },
            ]} />
          </div>

          <div className={cx("overflow-x-auto", u.panel)}>
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className={cx("border-b", u.divider)}>
                  <th className={cx(th, "w-10 text-center")}>#</th>
                  <th className={th}>Nome</th>
                  <th className={cx(th, "text-right")}>Prezzo</th>
                  <th className={cx(th, "text-right")}>24h</th>
                  <th className={cx(th, "text-right hidden md:table-cell")}>Cap. di mercato</th>
                  <th className={cx(th, "text-center w-28")}>7 giorni</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className={cx("border-b last:border-0 cursor-pointer hover:bg-white/5 transition-colors", u.divider)}>
                    <td className={cx(td, "text-center", u.muted)}>{c.market_cap_rank}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                        <span className={cx("font-semibold", u.text)}>{c.name}</span>
                        <span className={cx("uppercase text-[10px]", u.muted)}>{c.symbol}</span>
                      </div>
                    </td>
                    <td className={cx(td, "text-right font-mono font-semibold", u.text)}>{price(c.current_price)}</td>
                    <td className={cx(td, "text-right")}><Change value={c.price_change_percentage_24h || 0} /></td>
                    <td className={cx(td, "text-right hidden md:table-cell", u.muted)}>{compact(c.market_cap)}</td>
                    <td className={cx(td, "text-center")}><div className="flex justify-center"><Sparkline prices={c.sparkline_in_7d?.price ?? []} up={(c.price_change_percentage_7d_in_currency ?? c.price_change_percentage_24h) >= 0} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && <p className={cx("p-6 text-center text-xs", u.muted)}>Nessuna crypto corrisponde alla ricerca.</p>}
          </div>

          {selected && (
            <Panel className="space-y-3">
              <SectionTitle right={<Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Chiudi</Button>}>
                {selected.name} ({selected.symbol.toUpperCase()}) · #{selected.market_cap_rank}
              </SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["Prezzo", price(selected.current_price)],
                  ["Massimo 24h", price(selected.high_24h)],
                  ["Minimo 24h", price(selected.low_24h)],
                  ["Volume 24h", compact(selected.total_volume)],
                ].map(([label, value]) => (
                  <div key={label}><span className={u.statLabel}>{label}</span><div className={cx("font-mono text-sm font-semibold", u.text)}>{value}</div></div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Notice tone="warn">Dati dimostrativi statici: non sono quotazioni in tempo reale e non vanno usati per decisioni di investimento.</Notice>
          <div className={cx("overflow-x-auto", u.panel)}>
            <table className="w-full min-w-[620px] text-xs">
              <thead>
                <tr className={cx("border-b", u.divider)}>
                  <th className={th}>Ticker</th>
                  <th className={th}>Azienda</th>
                  <th className={cx(th, "hidden sm:table-cell")}>Settore</th>
                  <th className={cx(th, "text-right")}>Prezzo</th>
                  <th className={cx(th, "text-right")}>Var.</th>
                  <th className={cx(th, "text-right hidden md:table-cell")}>Cap.</th>
                </tr>
              </thead>
              <tbody>
                {NASDAQ_STOCKS.map((s) => (
                  <tr key={s.symbol} className={cx("border-b last:border-0", u.divider)}>
                    <td className={cx(td, "font-bold", u.accent)}>{s.symbol}</td>
                    <td className={cx(td, u.text)}>{s.name}</td>
                    <td className={cx(td, "hidden sm:table-cell", u.muted)}>{s.sector}</td>
                    <td className={cx(td, "text-right font-mono font-semibold", u.text)}>{price(s.price)}</td>
                    <td className={cx(td, "text-right")}><Change value={s.changePercent} /></td>
                    <td className={cx(td, "text-right hidden md:table-cell", u.muted)}>{s.marketCap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Stack>
  );
}
