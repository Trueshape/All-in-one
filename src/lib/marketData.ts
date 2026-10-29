/** Static reference data used when the live API is unavailable. NOT real-time. */
export interface CryptoCoin {
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

export interface StockItem {
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

// Reference snapshot of the largest coins (not live).
export const FALLBACK_CRYPTO: CryptoCoin[] = [
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
export const NASDAQ_STOCKS: StockItem[] = [
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
