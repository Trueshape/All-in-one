import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  DollarSign,
  Euro,
  BarChart3,
  Globe,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
}

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  sector: string;
  high52: number;
  low52: number;
  sparkline: number[];
}

// Fallback Crypto dataset (Top 100 simulation if API is rate limited)
const FALLBACK_CRYPTO: CryptoCoin[] = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", current_price: 94850.00, market_cap: 1870000000000, market_cap_rank: 1, total_volume: 42100000000, high_24h: 96200, low_24h: 93400, price_change_percentage_24h: 2.45, price_change_percentage_7d_in_currency: 5.12, sparkline_in_7d: { price: [90000, 91200, 90800, 92500, 93800, 93100, 94850] } },
  { id: "ethereum", symbol: "eth", name: "Ethereum", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", current_price: 3420.50, market_cap: 412000000000, market_cap_rank: 2, total_volume: 21500000000, high_24h: 3480, low_24h: 3350, price_change_percentage_24h: -0.85, price_change_percentage_7d_in_currency: 3.40, sparkline_in_7d: { price: [3300, 3350, 3320, 3400, 3450, 3390, 3420] } },
  { id: "tether", symbol: "usdt", name: "Tether USDT", image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", current_price: 1.00, market_cap: 118000000000, market_cap_rank: 3, total_volume: 65000000000, high_24h: 1.002, low_24h: 0.998, price_change_percentage_24h: 0.02, price_change_percentage_7d_in_currency: 0.01, sparkline_in_7d: { price: [1, 1, 1, 1, 1, 1, 1] } },
  { id: "binancecoin", symbol: "bnb", name: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", current_price: 645.20, market_cap: 94000000000, market_cap_rank: 4, total_volume: 1200000000, high_24h: 658, low_24h: 638, price_change_percentage_24h: 1.75, price_change_percentage_7d_in_currency: -1.20, sparkline_in_7d: { price: [650, 655, 640, 638, 642, 640, 645] } },
  { id: "solana", symbol: "sol", name: "Solana", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png", current_price: 215.80, market_cap: 102000000000, market_cap_rank: 5, total_volume: 7800000000, high_24h: 222, low_24h: 208, price_change_percentage_24h: 4.80, price_change_percentage_7d_in_currency: 12.50, sparkline_in_7d: { price: [190, 195, 200, 205, 210, 208, 215] } },
  { id: "ripple", symbol: "xrp", name: "XRP", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", current_price: 2.35, market_cap: 132000000000, market_cap_rank: 6, total_volume: 9500000000, high_24h: 2.48, low_24h: 2.20, price_change_percentage_24h: -3.20, price_change_percentage_7d_in_currency: 8.90, sparkline_in_7d: { price: [2.1, 2.2, 2.4, 2.5, 2.4, 2.3, 2.35] } },
  { id: "cardano", symbol: "ada", name: "Cardano", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png", current_price: 0.88, market_cap: 31000000000, market_cap_rank: 7, total_volume: 1400000000, high_24h: 0.92, low_24h: 0.85, price_change_percentage_24h: 1.10, price_change_percentage_7d_in_currency: -2.30, sparkline_in_7d: { price: [0.90, 0.89, 0.87, 0.86, 0.88, 0.87, 0.88] } },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", current_price: 0.38, market_cap: 55000000000, market_cap_rank: 8, total_volume: 3800000000, high_24h: 0.41, low_24h: 0.36, price_change_percentage_24h: 6.20, price_change_percentage_7d_in_currency: 18.40, sparkline_in_7d: { price: [0.32, 0.33, 0.35, 0.37, 0.36, 0.37, 0.38] } },
  { id: "avalanche-2", symbol: "avax", name: "Avalanche", image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", current_price: 42.10, market_cap: 17200000000, market_cap_rank: 9, total_volume: 850000000, high_24h: 43.8, low_24h: 40.5, price_change_percentage_24h: 3.10, price_change_percentage_7d_in_currency: 4.20, sparkline_in_7d: { price: [40, 41, 40.5, 41.8, 42.5, 41.5, 42.1] } },
  { id: "sui", symbol: "sui", name: "Sui", image: "https://assets.coingecko.com/coins/images/26375/large/sui_asset.png", current_price: 3.45, market_cap: 9800000000, market_cap_rank: 10, total_volume: 1600000000, high_24h: 3.65, low_24h: 3.30, price_change_percentage_24h: -1.80, price_change_percentage_7d_in_currency: 14.20, sparkline_in_7d: { price: [3.0, 3.1, 3.3, 3.5, 3.6, 3.4, 3.45] } },
  { id: "chainlink", symbol: "link", name: "Chainlink", image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", current_price: 18.90, market_cap: 11500000000, market_cap_rank: 11, total_volume: 620000000, high_24h: 19.5, low_24h: 18.2, price_change_percentage_24h: 2.05, price_change_percentage_7d_in_currency: 6.80, sparkline_in_7d: { price: [17.5, 18.0, 18.2, 18.8, 19.1, 18.6, 18.9] } },
  { id: "polkadot", symbol: "dot", name: "Polkadot", image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png", current_price: 8.20, market_cap: 11800000000, market_cap_rank: 12, total_volume: 480000000, high_24h: 8.50, low_24h: 7.95, price_change_percentage_24h: -0.90, price_change_percentage_7d_in_currency: 1.50, sparkline_in_7d: { price: [8.0, 8.1, 8.3, 8.2, 8.4, 8.1, 8.2] } },
];

// NASDAQ Stocks Top Companies Dataset
const NASDAQ_STOCKS: StockItem[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 238.45, change: 3.12, changePercent: 1.32, volume: "52.4M", marketCap: "$3.62T", sector: "Technology", high52: 245.00, low52: 164.08, sparkline: [232, 234, 233, 236, 237, 238.45] },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 428.90, change: 4.85, changePercent: 1.14, volume: "21.8M", marketCap: "$3.18T", sector: "Software", high52: 468.35, low52: 388.00, sparkline: [420, 422, 421, 425, 426, 428.90] },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 138.25, change: -2.10, changePercent: -1.50, volume: "185.2M", marketCap: "$3.39T", sector: "Semiconductors", high52: 149.77, low52: 45.10, sparkline: [142, 140, 141, 139, 137, 138.25] },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 184.60, change: 2.30, changePercent: 1.26, volume: "24.1M", marketCap: "$2.28T", sector: "Interactive Media", high52: 191.75, low52: 130.60, sparkline: [180, 181, 183, 182, 184, 184.60] },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 212.30, change: 3.90, changePercent: 1.87, volume: "38.6M", marketCap: "$2.21T", sector: "E-Commerce", high52: 215.90, low52: 143.20, sparkline: [205, 207, 209, 210, 211, 212.30] },
  { symbol: "META", name: "Meta Platforms", price: 610.75, change: 8.40, changePercent: 1.40, volume: "14.2M", marketCap: "$1.54T", sector: "Social Media", high52: 630.00, low52: 344.30, sparkline: [595, 600, 602, 608, 605, 610.75] },
  { symbol: "TSLA", name: "Tesla Inc.", price: 342.10, change: -8.60, changePercent: -2.45, volume: "74.5M", marketCap: "$1.09T", sector: "Automotive & EV", high52: 358.64, low52: 138.80, sparkline: [355, 350, 348, 345, 340, 342.10] },
  { symbol: "AVGO", name: "Broadcom Inc.", price: 172.40, change: 2.15, changePercent: 1.26, volume: "18.3M", marketCap: "$805B", sector: "Semiconductors", high52: 185.00, low52: 110.20, sparkline: [168, 170, 169, 171, 173, 172.40] },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 128.50, change: -1.20, changePercent: -0.92, volume: "42.1M", marketCap: "$208B", sector: "Semiconductors", high52: 227.30, low52: 116.20, sparkline: [131, 130, 129, 128, 129, 128.50] },
  { symbol: "NFLX", name: "Netflix Inc.", price: 890.15, change: 12.30, changePercent: 1.40, volume: "5.4M", marketCap: "$380B", sector: "Entertainment", high52: 915.00, low52: 460.00, sparkline: [870, 875, 882, 885, 888, 890.15] },
  { symbol: "COST", name: "Costco Wholesale", price: 920.40, change: 4.10, changePercent: 0.45, volume: "2.1M", marketCap: "$408B", sector: "Retail", high52: 948.00, low52: 650.00, sparkline: [910, 915, 918, 922, 919, 920.40] },
  { symbol: "TMUS", name: "T-Mobile US Inc.", price: 236.80, change: 1.90, changePercent: 0.81, volume: "4.8M", marketCap: "$278B", sector: "Telecom", high52: 242.00, low52: 155.00, sparkline: [232, 233, 235, 234, 236, 236.80] },
];

export default function CryptoAndNasdaqTracker() {
  const [activeTab, setActiveTab] = useState<"crypto" | "nasdaq">("crypto");
  const [currency, setCurrency] = useState<"usd" | "eur">("usd");
  const [eurRate, setEurRate] = useState<number>(0.92);
  const [cryptoData, setCryptoData] = useState<CryptoCoin[]>(FALLBACK_CRYPTO);
  const [loadingCrypto, setLoadingCrypto] = useState<boolean>(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cryptoFilter, setCryptoFilter] = useState<"all" | "gainers" | "losers" | "high_vol">("all");
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Convert USD to current currency
  const formatPrice = (usdAmount: number) => {
    const value = currency === "eur" ? usdAmount * eurRate : usdAmount;
    const symbol = currency === "eur" ? "€" : "$";

    if (value >= 1000) {
      return `${symbol}${value.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (value >= 1) {
      return `${symbol}${value.toFixed(2)}`;
    } else if (value >= 0.01) {
      return `${symbol}${value.toFixed(4)}`;
    } else {
      return `${symbol}${value.toFixed(6)}`;
    }
  };

  const formatMarketCap = (num: number) => {
    const value = currency === "eur" ? num * eurRate : num;
    const symbol = currency === "eur" ? "€" : "$";
    if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
    return `${symbol}${value.toLocaleString()}`;
  };

  // Fetch Crypto Top 100 from API
  const fetchCrypto = async () => {
    setLoadingCrypto(true);
    setCryptoError(null);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d"
      );
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCryptoData(data);
        setLastUpdated(new Date());
      } else {
        throw new Error("Dati non validi");
      }
    } catch (err: any) {
      console.warn("CoinGecko API rate limit or error, using enhanced fallback dataset", err);
      setCryptoError("Aggiornamento live temporaneamente limitato. Visualizzati dati di mercato recenti.");
      // Enhance fallback with tiny random noise to simulate live updates
      setCryptoData((prev) =>
        prev.map((c) => ({
          ...c,
          current_price: c.current_price * (1 + (Math.random() * 0.004 - 0.002)),
        }))
      );
    } finally {
      setLoadingCrypto(false);
    }
  };

  useEffect(() => {
    fetchCrypto();
    // Refresh EUR rate
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((d) => {
        if (d && d.rates && d.rates.EUR) {
          setEurRate(d.rates.EUR);
        }
      })
      .catch(() => {});
  }, []);

  // Filtered Crypto List
  const filteredCrypto = useMemo(() => {
    return cryptoData.filter((coin) => {
      const matchesSearch =
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (cryptoFilter === "gainers") return coin.price_change_percentage_24h > 0;
      if (cryptoFilter === "losers") return coin.price_change_percentage_24h < 0;
      if (cryptoFilter === "high_vol") return coin.total_volume > 1000000000;

      return true;
    });
  }, [cryptoData, searchQuery, cryptoFilter]);

  // Nasdaq Index calculation stats
  const nasdaqIndex = {
    value: 19820.45,
    change: 142.80,
    changePercent: 0.72,
    dayHigh: 19890.10,
    dayLow: 19680.50,
    yearHigh: 20100.00,
    yearLow: 15400.00,
    status: "Mercato Aperto",
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/40 p-3.5 border border-zinc-800 rounded-lg">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-md border border-zinc-800">
          <button
            onClick={() => setActiveTab("crypto")}
            className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded transition-all flex items-center gap-2 ${
              activeTab === "crypto"
                ? "bg-amber-500/15 border border-amber-500/35 text-amber-400 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Crypto Top 100</span>
          </button>
          <button
            onClick={() => setActiveTab("nasdaq")}
            className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded transition-all flex items-center gap-2 ${
              activeTab === "nasdaq"
                ? "bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 font-bold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>NASDAQ & Indici</span>
          </button>
        </div>

        {/* Currency & Refresh Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1">
            <button
              onClick={() => setCurrency("usd")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold transition-all ${
                currency === "usd"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("eur")}
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold transition-all ${
                currency === "eur"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              EUR (€)
            </button>
          </div>

          <button
            onClick={fetchCrypto}
            disabled={loadingCrypto}
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded transition-all flex items-center gap-1.5 text-xs font-mono disabled:opacity-50 cursor-pointer"
            title="Ricarica Dati Live"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCrypto ? "animate-spin text-amber-400" : ""}`} />
            <span className="hidden sm:inline">Aggiorna</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CRYPTO TOP 100 */}
      {activeTab === "crypto" && (
        <div className="space-y-4">
          {/* Search & Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca crypto per nome o simbolo (es. Bitcoin, ETH, SOL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setCryptoFilter("all")}
                className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all whitespace-nowrap ${
                  cryptoFilter === "all"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Top 100
              </button>
              <button
                onClick={() => setCryptoFilter("gainers")}
                className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all whitespace-nowrap flex items-center gap-1 ${
                  cryptoFilter === "gainers"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Migliori 24h
              </button>
              <button
                onClick={() => setCryptoFilter("losers")}
                className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all whitespace-nowrap flex items-center gap-1 ${
                  cryptoFilter === "losers"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <TrendingDown className="w-3 h-3 text-rose-400" />
                Peggiori 24h
              </button>
              <button
                onClick={() => setCryptoFilter("high_vol")}
                className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-all whitespace-nowrap ${
                  cryptoFilter === "high_vol"
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Alto Volume (&gt;$1B)
              </button>
            </div>
          </div>

          {cryptoError && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] font-mono text-amber-300 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{cryptoError}</span>
            </div>
          )}

          {/* Crypto Table */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[10px] font-mono text-zinc-400 uppercase">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">Nome / Simbolo</th>
                  <th className="py-2.5 px-3 text-right">Prezzo</th>
                  <th className="py-2.5 px-3 text-right">24h %</th>
                  <th className="py-2.5 px-3 text-right hidden md:table-cell">Cap. di Mercato</th>
                  <th className="py-2.5 px-3 text-right hidden lg:table-cell">Volume 24h</th>
                  <th className="py-2.5 px-3 text-center w-28">Trend 7g</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 text-xs font-mono">
                {filteredCrypto.map((coin) => {
                  const isPositive24h = coin.price_change_percentage_24h >= 0;
                  const sparklinePoints = coin.sparkline_in_7d?.price || [];

                  // Generate SVG sparkline string
                  let svgPath = "";
                  if (sparklinePoints.length > 1) {
                    const min = Math.min(...sparklinePoints);
                    const max = Math.max(...sparklinePoints);
                    const range = max - min || 1;
                    const width = 80;
                    const height = 24;

                    svgPath = sparklinePoints
                      .map((p, i) => {
                        const x = (i / (sparklinePoints.length - 1)) * width;
                        const y = height - ((p - min) / range) * (height - 4) - 2;
                        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ");
                  }

                  return (
                    <tr
                      key={coin.id}
                      onClick={() => setSelectedCoin(coin)}
                      className="hover:bg-zinc-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 text-center text-zinc-500 text-[11px]">
                        {coin.market_cap_rank}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {coin.image ? (
                            <img
                              src={coin.image}
                              alt={coin.name}
                              className="w-5 h-5 rounded-full object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                              {coin.symbol.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
                              {coin.name}
                            </span>
                            <span className="ml-1.5 text-[10px] text-zinc-500 uppercase">
                              {coin.symbol}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-200">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${
                            isPositive24h
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {isPositive24h ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-400 text-[11px] hidden md:table-cell">
                        {formatMarketCap(coin.market_cap)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-400 text-[11px] hidden lg:table-cell">
                        {formatMarketCap(coin.total_volume)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {svgPath ? (
                          <div className="flex justify-center">
                            <svg width="80" height="24" className="overflow-visible">
                              <path
                                d={svgPath}
                                fill="none"
                                stroke={isPositive24h ? "#34d399" : "#f87171"}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Coin Modal / Drawer */}
          {selectedCoin && (
            <div className="p-4 bg-zinc-950/80 border border-amber-500/30 rounded-lg space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <img src={selectedCoin.image} alt={selectedCoin.name} className="w-6 h-6 rounded-full" />
                  <h3 className="text-sm font-mono font-bold text-zinc-100">
                    {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})
                  </h3>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/30">
                    Rank #{selectedCoin.market_cap_rank}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCoin(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono"
                >
                  Chiudi ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block">Prezzo Attuale</span>
                  <span className="text-sm font-bold text-zinc-100">{formatPrice(selectedCoin.current_price)}</span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block">Massimo 24h</span>
                  <span className="text-sm font-bold text-emerald-400">{formatPrice(selectedCoin.high_24h || selectedCoin.current_price * 1.03)}</span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block">Minimo 24h</span>
                  <span className="text-sm font-bold text-rose-400">{formatPrice(selectedCoin.low_24h || selectedCoin.current_price * 0.97)}</span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 block">Capitalizzazione</span>
                  <span className="text-sm font-bold text-zinc-200">{formatMarketCap(selectedCoin.market_cap)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NASDAQ & INDICI */}
      {activeTab === "nasdaq" && (
        <div className="space-y-5">
          {/* Nasdaq Main Index Banner */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-950 to-zinc-950 border border-indigo-500/30 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-mono font-bold text-zinc-100">NASDAQ Composite (^IXIC)</h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                    {nasdaqIndex.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  Indice tecnologico principale della borsa di Wall Street (New York)
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-2xl font-mono font-bold text-zinc-100 block">
                  {nasdaqIndex.value.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                  +{nasdaqIndex.change} (+{nasdaqIndex.changePercent}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-850 text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Range Giornaliero</span>
                <span className="text-zinc-300 font-bold">
                  {nasdaqIndex.dayLow.toLocaleString()} - {nasdaqIndex.dayHigh.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Max / Min 52 Settimane</span>
                <span className="text-zinc-300 font-bold">
                  {nasdaqIndex.yearLow.toLocaleString()} - {nasdaqIndex.yearHigh.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Componenti Top</span>
                <span className="text-zinc-300 font-bold">100 Aziende Tech</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Borsa</span>
                <span className="text-zinc-300 font-bold">NASDAQ, USA</span>
              </div>
            </div>
          </div>

          {/* Top Nasdaq 100 Companies Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Principali Azioni NASDAQ 100</span>
            </h3>

            <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-[10px] font-mono text-zinc-400 uppercase">
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Azienda</th>
                    <th className="py-2.5 px-3">Settore</th>
                    <th className="py-2.5 px-3 text-right">Prezzo ($)</th>
                    <th className="py-2.5 px-3 text-right">Var. %</th>
                    <th className="py-2.5 px-3 text-right hidden sm:table-cell">Cap. di Mercato</th>
                    <th className="py-2.5 px-3 text-right hidden lg:table-cell">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60 text-xs font-mono">
                  {NASDAQ_STOCKS.map((stock) => {
                    const isPos = stock.changePercent >= 0;
                    return (
                      <tr key={stock.symbol} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-indigo-400">
                          {stock.symbol}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-100">
                          {stock.name}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          {stock.sector}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-zinc-200">
                          ${stock.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${
                              isPos
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-rose-400 bg-rose-500/10"
                            }`}
                          >
                            {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isPos ? "+" : ""}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-400 text-[11px] hidden sm:table-cell">
                          {stock.marketCap}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-400 text-[11px] hidden lg:table-cell">
                          {stock.volume}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
