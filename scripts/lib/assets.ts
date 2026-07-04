/**
 * Asset registry — the single source of truth for what burrito tracks.
 * ids are lowercase and double as directory names: data/raw/<id>/daily.json
 * and data/raw/mcap/<id>.json.
 *
 * binance: USDT spot pair for daily closes (null = not listed on Binance).
 * coinmetrics: Coin Metrics community-API asset id for market caps
 * (null = not covered; verified by the mcap fetcher).
 */
export interface AssetDef {
  id: string;
  symbol: string;
  name: string;
  binance: string | null;
  coinmetrics: string | null;
  stable?: boolean;
}

export const ASSETS: AssetDef[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", binance: "BTCUSDT", coinmetrics: "btc" },
  { id: "eth", symbol: "ETH", name: "Ethereum", binance: "ETHUSDT", coinmetrics: "eth" },
  { id: "bnb", symbol: "BNB", name: "BNB", binance: "BNBUSDT", coinmetrics: null },
  { id: "sol", symbol: "SOL", name: "Solana", binance: "SOLUSDT", coinmetrics: null },
  { id: "xrp", symbol: "XRP", name: "XRP", binance: "XRPUSDT", coinmetrics: "xrp" },
  { id: "ada", symbol: "ADA", name: "Cardano", binance: "ADAUSDT", coinmetrics: "ada" },
  { id: "doge", symbol: "DOGE", name: "Dogecoin", binance: "DOGEUSDT", coinmetrics: "doge" },
  { id: "trx", symbol: "TRX", name: "TRON", binance: "TRXUSDT", coinmetrics: null },
  { id: "ton", symbol: "TON", name: "Toncoin", binance: "TONUSDT", coinmetrics: null },
  { id: "avax", symbol: "AVAX", name: "Avalanche", binance: "AVAXUSDT", coinmetrics: null },
  { id: "link", symbol: "LINK", name: "Chainlink", binance: "LINKUSDT", coinmetrics: "link" },
  { id: "dot", symbol: "DOT", name: "Polkadot", binance: "DOTUSDT", coinmetrics: null },
  { id: "pol", symbol: "POL", name: "Polygon", binance: "POLUSDT", coinmetrics: "pol_eth" },
  { id: "ltc", symbol: "LTC", name: "Litecoin", binance: "LTCUSDT", coinmetrics: "ltc" },
  { id: "xlm", symbol: "XLM", name: "Stellar", binance: "XLMUSDT", coinmetrics: "xlm" },
  { id: "atom", symbol: "ATOM", name: "Cosmos", binance: "ATOMUSDT", coinmetrics: null },
  { id: "algo", symbol: "ALGO", name: "Algorand", binance: "ALGOUSDT", coinmetrics: "algo" },
  { id: "vet", symbol: "VET", name: "VeChain", binance: "VETUSDT", coinmetrics: null },
  { id: "hbar", symbol: "HBAR", name: "Hedera", binance: "HBARUSDT", coinmetrics: null },
  { id: "aave", symbol: "AAVE", name: "Aave", binance: "AAVEUSDT", coinmetrics: "aave" },
  { id: "mkr", symbol: "MKR", name: "Maker", binance: null, coinmetrics: null },
  { id: "xtz", symbol: "XTZ", name: "Tezos", binance: "XTZUSDT", coinmetrics: null },
  { id: "sui", symbol: "SUI", name: "Sui", binance: "SUIUSDT", coinmetrics: null },
  { id: "render", symbol: "RENDER", name: "Render", binance: "RENDERUSDT", coinmetrics: null },
  { id: "shib", symbol: "SHIB", name: "Shiba Inu", binance: "SHIBUSDT", coinmetrics: "shib_eth" },
  { id: "near", symbol: "NEAR", name: "NEAR", binance: "NEARUSDT", coinmetrics: null },
  { id: "uni", symbol: "UNI", name: "Uniswap", binance: "UNIUSDT", coinmetrics: "uni" },
  { id: "fil", symbol: "FIL", name: "Filecoin", binance: "FILUSDT", coinmetrics: null },
  { id: "xmr", symbol: "XMR", name: "Monero", binance: null, coinmetrics: "xmr" },
  // stablecoins: market caps only (for SSR / altcoin-mcap math)
  { id: "usdt", symbol: "USDT", name: "Tether", binance: null, coinmetrics: "usdt", stable: true },
  { id: "usdc", symbol: "USDC", name: "USD Coin", binance: null, coinmetrics: "usdc", stable: true },
  { id: "dai", symbol: "DAI", name: "Dai", binance: null, coinmetrics: "dai", stable: true },
];

export const TRADEABLE = ASSETS.filter((a) => a.binance !== null);
export const STABLES = ASSETS.filter((a) => a.stable);
