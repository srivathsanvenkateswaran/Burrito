/**
 * Asset registry — the single source of truth for what burrito tracks.
 * ids are lowercase and double as directory names: data/raw/<id>/daily.json,
 * data/metrics/<id>/*.json and data/raw/mcap/<id>.json.
 *
 * class/suite decide behaviour:
 *   suite "full"    → the whole per-asset chart suite is computed (data/metrics/<id>/)
 *   suite "summary" → a scalar row in the risk dashboard only
 *   suite "supply"  → circulating-supply series only (stablecoins)
 *
 * price: where daily candles come from (kind "none" = mcap/supply-only asset).
 * coinmetrics: Coin Metrics community-API id for market caps (null = not covered).
 * sec: SEC CIK for filers whose shares outstanding feed the equity market cap.
 */
export type AssetClass = "crypto" | "stablecoin" | "equity" | "index";
export type Suite = "full" | "summary" | "supply";

export type FallbackSource =
  | { kind: "nasdaq"; symbol: string; assetclass: "stocks" | "index" } // 10y window only
  | { kind: "cboe"; file: "SPX_History.csv" } // close-only, 1975+
  | { kind: "yahoo"; symbol: string };

export type PriceSource =
  | { kind: "binance"; symbol: string } // e.g. "SOLUSDT"
  | { kind: "yahoo"; symbol: string; fallback?: FallbackSource } // "AAPL", "^GSPC", "005930.KS"
  | { kind: "naver"; symbol: string; fallback?: FallbackSource } // "005930"
  | { kind: "none" }; // mcap/supply-only assets

export interface AssetDef {
  id: string; // lowercase; dir name under data/raw and data/metrics
  symbol: string; // display ticker: "BTC", "AAPL", "005930.KS", "SPX"
  name: string; // "Apple", "S&P 500"
  class: AssetClass;
  suite: Suite;
  sector: string;
  about: string; // 1–3 sentences: what it is and why it is tracked
  price: PriceSource;
  quote: "USD" | "USDT" | "KRW";
  periodsPerYear: 365 | 252; // crypto 365, equities/indices 252
  origin?: string; // YYYY-MM-DD time-origin for log-time regressions; defaults to first row date
  startDate?: string; // drop rows before this (pre-listing shells etc.)
  benchmark?: string; // id of the asset used for relative-strength charts
  cycles?: { bottoms: string[]; peaks: string[] }; // canonical overrides; otherwise auto-detected
  halvings?: string[]; // btc only
  coinmetrics?: string | null;
  stable?: boolean;
  sec?: { cik: number }; // equities filing with the SEC (shares outstanding → mcap)
}

const CRYPTO = {
  class: "crypto",
  suite: "summary",
  quote: "USDT",
  periodsPerYear: 365,
  benchmark: "btc",
} as const;

const EQUITY = { class: "equity", suite: "full", quote: "USD", periodsPerYear: 252, benchmark: "spx" } as const;
const INDEX = { class: "index", suite: "full", quote: "USD", periodsPerYear: 252, benchmark: "spx" } as const;

function binance(symbol: string): PriceSource {
  return { kind: "binance", symbol };
}

function stock(ticker: string): PriceSource {
  return { kind: "yahoo", symbol: ticker, fallback: { kind: "nasdaq", symbol: ticker, assetclass: "stocks" } };
}

export const ASSETS: AssetDef[] = [
  // ---------------------------------------------------------------- crypto
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    ...CRYPTO,
    suite: "full",
    quote: "USD",
    sector: "Layer 1",
    about:
      "The first and largest cryptocurrency, a fixed-supply proof-of-work network launched in 2009. Burrito's reference asset: every cycle, halving and on-chain chart is built around it.",
    price: binance("BTCUSDT"),
    origin: "2009-01-03",
    benchmark: "spx",
    halvings: ["2012-11-28", "2016-07-09", "2020-05-11", "2024-04-19"],
    cycles: {
      bottoms: ["2011-11-18", "2015-01-14", "2018-12-15", "2022-11-21"],
      // 2025-10-06 = ATH close of the 2024-25 cycle; treated as the latest cycle peak
      peaks: ["2011-06-08", "2013-11-30", "2017-12-17", "2021-11-10", "2025-10-06"],
    },
    coinmetrics: "btc",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    ...CRYPTO,
    suite: "full",
    sector: "Layer 1",
    about:
      "The largest smart-contract platform and the settlement layer for most stablecoins, DeFi and rollups. Second-largest crypto asset by market cap.",
    price: binance("ETHUSDT"),
    coinmetrics: "eth",
  },
  {
    id: "bnb",
    symbol: "BNB",
    name: "BNB",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Native token of the BNB Chain and Binance's exchange ecosystem.",
    price: binance("BNBUSDT"),
    coinmetrics: null,
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    ...CRYPTO,
    suite: "full",
    sector: "Layer 1",
    about:
      "High-throughput single-shard smart-contract chain; the main venue for on-chain trading, memecoins and consumer apps outside Ethereum.",
    price: binance("SOLUSDT"),
    coinmetrics: null,
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    ...CRYPTO,
    sector: "Payments",
    about: "Native asset of the XRP Ledger, positioned for cross-border payments and bank settlement.",
    price: binance("XRPUSDT"),
    coinmetrics: "xrp",
  },
  {
    id: "ada",
    symbol: "ADA",
    name: "Cardano",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Proof-of-stake smart-contract chain built on peer-reviewed research.",
    price: binance("ADAUSDT"),
    coinmetrics: "ada",
  },
  {
    id: "doge",
    symbol: "DOGE",
    name: "Dogecoin",
    ...CRYPTO,
    sector: "Memecoins",
    about: "The original memecoin, a Litecoin fork with uncapped supply; a proxy for retail risk appetite.",
    price: binance("DOGEUSDT"),
    coinmetrics: "doge",
  },
  {
    id: "trx",
    symbol: "TRX",
    name: "TRON",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Smart-contract chain that carries the largest share of USDT transfers by count.",
    price: binance("TRXUSDT"),
    coinmetrics: null,
  },
  {
    id: "ton",
    symbol: "TON",
    name: "Toncoin",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Layer 1 integrated with Telegram's messenger for mini-apps and payments.",
    price: binance("TONUSDT"),
    coinmetrics: null,
  },
  {
    id: "avax",
    symbol: "AVAX",
    name: "Avalanche",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Subnet-based smart-contract platform aimed at institutional and gaming chains.",
    price: binance("AVAXUSDT"),
    coinmetrics: null,
  },
  {
    id: "link",
    symbol: "LINK",
    name: "Chainlink",
    ...CRYPTO,
    sector: "DeFi",
    about: "The dominant oracle network feeding price data and cross-chain messaging to DeFi protocols.",
    price: binance("LINKUSDT"),
    coinmetrics: "link",
  },
  {
    id: "dot",
    symbol: "DOT",
    name: "Polkadot",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Shared-security relay chain that hosts application-specific parachains.",
    price: binance("DOTUSDT"),
    coinmetrics: null,
  },
  {
    id: "pol",
    symbol: "POL",
    name: "Polygon",
    ...CRYPTO,
    sector: "Infrastructure",
    about: "Ethereum scaling network (PoS sidechain and zk rollups); POL replaced MATIC in 2024.",
    price: binance("POLUSDT"),
    coinmetrics: "pol_eth",
  },
  {
    id: "ltc",
    symbol: "LTC",
    name: "Litecoin",
    ...CRYPTO,
    sector: "Payments",
    about: "Early Bitcoin fork with faster blocks; one of the longest-running proof-of-work payment coins.",
    price: binance("LTCUSDT"),
    coinmetrics: "ltc",
  },
  {
    id: "xlm",
    symbol: "XLM",
    name: "Stellar",
    ...CRYPTO,
    sector: "Payments",
    about: "Payments-focused ledger for remittances and tokenised fiat.",
    price: binance("XLMUSDT"),
    coinmetrics: "xlm",
  },
  {
    id: "atom",
    symbol: "ATOM",
    name: "Cosmos",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Hub of the Cosmos ecosystem of IBC-connected app chains.",
    price: binance("ATOMUSDT"),
    coinmetrics: null,
  },
  {
    id: "algo",
    symbol: "ALGO",
    name: "Algorand",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Pure proof-of-stake chain aimed at payments and tokenised real-world assets.",
    price: binance("ALGOUSDT"),
    coinmetrics: "algo",
  },
  {
    id: "vet",
    symbol: "VET",
    name: "VeChain",
    ...CRYPTO,
    sector: "Infrastructure",
    about: "Enterprise supply-chain tracking chain.",
    price: binance("VETUSDT"),
    coinmetrics: null,
  },
  {
    id: "hbar",
    symbol: "HBAR",
    name: "Hedera",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Hashgraph-based public ledger governed by a council of large corporations.",
    price: binance("HBARUSDT"),
    coinmetrics: null,
  },
  {
    id: "aave",
    symbol: "AAVE",
    name: "Aave",
    ...CRYPTO,
    sector: "DeFi",
    about: "The largest on-chain lending protocol by deposits.",
    price: binance("AAVEUSDT"),
    coinmetrics: "aave",
  },
  {
    id: "mkr",
    symbol: "MKR",
    name: "Maker",
    ...CRYPTO,
    sector: "DeFi",
    about: "Governance token of the Maker/Sky protocol that issues the DAI stablecoin. Not listed on Binance; market cap only.",
    price: { kind: "none" },
    coinmetrics: null,
  },
  {
    id: "xtz",
    symbol: "XTZ",
    name: "Tezos",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Self-amending proof-of-stake chain with on-chain governance.",
    price: binance("XTZUSDT"),
    coinmetrics: null,
  },
  {
    id: "sui",
    symbol: "SUI",
    name: "Sui",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Move-language Layer 1 from ex-Meta Diem engineers, built for parallel execution.",
    price: binance("SUIUSDT"),
    coinmetrics: null,
  },
  {
    id: "render",
    symbol: "RENDER",
    name: "Render",
    ...CRYPTO,
    sector: "Infrastructure",
    about: "Decentralised GPU rendering and compute marketplace; the main crypto proxy for AI-compute demand.",
    price: binance("RENDERUSDT"),
    coinmetrics: null,
  },
  {
    id: "shib",
    symbol: "SHIB",
    name: "Shiba Inu",
    ...CRYPTO,
    sector: "Memecoins",
    about: "Ethereum-based memecoin with its own L2 (Shibarium); a retail-sentiment gauge.",
    price: binance("SHIBUSDT"),
    coinmetrics: "shib_eth",
  },
  {
    id: "near",
    symbol: "NEAR",
    name: "NEAR",
    ...CRYPTO,
    sector: "Layer 1",
    about: "Sharded proof-of-stake chain pitched at AI agents and chain abstraction.",
    price: binance("NEARUSDT"),
    coinmetrics: null,
  },
  {
    id: "uni",
    symbol: "UNI",
    name: "Uniswap",
    ...CRYPTO,
    sector: "DeFi",
    about: "Governance token of the largest decentralised exchange.",
    price: binance("UNIUSDT"),
    coinmetrics: "uni",
  },
  {
    id: "fil",
    symbol: "FIL",
    name: "Filecoin",
    ...CRYPTO,
    sector: "Infrastructure",
    about: "Decentralised storage network paying providers for verifiable capacity.",
    price: binance("FILUSDT"),
    coinmetrics: null,
  },
  {
    id: "xmr",
    symbol: "XMR",
    name: "Monero",
    ...CRYPTO,
    sector: "Payments",
    about: "Privacy coin with ring signatures and stealth addresses. Delisted from Binance; market cap only.",
    price: { kind: "none" },
    coinmetrics: "xmr",
  },

  // ----------------------------------------------------------- stablecoins
  // market caps for SSR / altcoin-mcap math; USDT also gets a supply chart
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether",
    class: "stablecoin",
    suite: "supply",
    sector: "Stablecoins",
    about:
      "The largest dollar stablecoin and crypto's main trading collateral. Its circulating supply is tracked as a gauge of dry powder entering or leaving the market.",
    price: { kind: "none" },
    quote: "USD",
    periodsPerYear: 365,
    coinmetrics: "usdt",
    stable: true,
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    class: "stablecoin",
    suite: "summary",
    sector: "Stablecoins",
    about: "Circle's regulated dollar stablecoin, the second largest by supply.",
    price: { kind: "none" },
    quote: "USD",
    periodsPerYear: 365,
    coinmetrics: "usdc",
    stable: true,
  },
  {
    id: "dai",
    symbol: "DAI",
    name: "Dai",
    class: "stablecoin",
    suite: "summary",
    sector: "Stablecoins",
    about: "Over-collateralised stablecoin issued by the Maker/Sky protocol.",
    price: { kind: "none" },
    quote: "USD",
    periodsPerYear: 365,
    coinmetrics: "dai",
    stable: true,
  },

  // -------------------------------------------------------------- Big Tech
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "iPhone, Mac and services company with the largest installed base of consumer devices. Tracked as the on-device AI endpoint and the biggest single weight in the S&P 500.",
    price: stock("AAPL"),
    origin: "1980-12-12",
    sec: { cik: 320193 },
  },
  {
    id: "amzn",
    symbol: "AMZN",
    name: "Amazon",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "E-commerce and cloud company; AWS is the largest cloud provider and one of the biggest buyers of GPUs and data-centre capacity. Also builds its own Trainium/Inferentia chips and backs Anthropic.",
    price: stock("AMZN"),
    origin: "1997-05-15",
    sec: { cik: 1018724 },
  },
  {
    id: "meta",
    symbol: "META",
    name: "Meta Platforms",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "Facebook, Instagram and WhatsApp. Trains the open-weight Llama models and is among the largest capex spenders on GPU clusters and data centres.",
    price: stock("META"),
    origin: "2012-05-18",
    sec: { cik: 1326801 },
  },
  {
    id: "nflx",
    symbol: "NFLX",
    name: "Netflix",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "Subscription streaming service with more than 300M paid households. Tracked as the consumer-internet bellwether in the group rather than an AI-infrastructure name.",
    price: stock("NFLX"),
    origin: "2002-05-23",
    sec: { cik: 1065280 },
  },
  {
    id: "googl",
    symbol: "GOOGL",
    name: "Alphabet",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "Google search, YouTube, Android and Google Cloud. Develops the Gemini models and its own TPU accelerators, so it is both a hyperscaler and a chip designer. Class A shares.",
    price: stock("GOOGL"),
    origin: "2004-08-19",
    sec: { cik: 1652044 },
  },
  {
    id: "msft",
    symbol: "MSFT",
    name: "Microsoft",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "Windows, Office and Azure. OpenAI's main compute and commercial partner, and the hyperscaler most exposed to AI demand through Azure and Copilot.",
    price: stock("MSFT"),
    origin: "1986-03-13",
    sec: { cik: 789019 },
  },
  {
    id: "orcl",
    symbol: "ORCL",
    name: "Oracle",
    ...EQUITY,
    sector: "Big Tech",
    about:
      "Database and enterprise-software vendor whose Oracle Cloud Infrastructure has become a major GPU landlord, with multi-year contracts to host OpenAI and other model builders.",
    price: stock("ORCL"),
    origin: "1986-03-12",
    sec: { cik: 1341439 },
  },

  // ------------------------------------------------------------ EV & Space
  {
    id: "tsla",
    symbol: "TSLA",
    name: "Tesla",
    ...EQUITY,
    sector: "EV & Space",
    about:
      "Electric vehicles, battery storage and the Full Self-Driving stack. Tracked for its autonomy and robotics bets and as the most retail-traded large cap.",
    price: stock("TSLA"),
    origin: "2010-06-29",
    sec: { cik: 1318605 },
  },
  {
    id: "spcx",
    symbol: "SPCX",
    name: "SpaceX",
    ...EQUITY,
    sector: "EV & Space",
    about:
      "Launch provider and operator of the Starlink satellite-internet constellation. Listed on Nasdaq on 2026-06-12 in the largest IPO on record; the series starts on that day.",
    price: stock("SPCX"),
    origin: "2026-06-12",
    startDate: "2026-06-12",
    sec: { cik: 1181412 },
  },

  // -------------------------------------------------------- Semiconductors
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "Designs the GPUs (Hopper, Blackwell, Rubin) and networking that run nearly all frontier-model training. The centre of the AI capex cycle.",
    price: stock("NVDA"),
    origin: "1999-01-22",
    sec: { cik: 1045810 },
  },
  {
    id: "amd",
    symbol: "AMD",
    name: "AMD",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "The second-source supplier of data-centre GPUs (Instinct MI series) and EPYC server CPUs, and the main challenger to NVIDIA in AI accelerators.",
    price: stock("AMD"),
    origin: "1979-10-15",
    sec: { cik: 2488 },
  },
  {
    id: "mu",
    symbol: "MU",
    name: "Micron",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "US memory maker supplying HBM3E for NVIDIA and AMD accelerators plus the DRAM and NAND in AI servers. Memory pricing is the swing factor in AI-server bills of materials.",
    price: stock("MU"),
    origin: "1984-06-01",
    sec: { cik: 723125 },
  },
  {
    id: "sndk",
    symbol: "SNDK",
    name: "Sandisk",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "NAND flash maker spun out of Western Digital in February 2025; supplies the enterprise SSDs used for data-centre storage tiers. Series starts at the spin-off.",
    price: stock("SNDK"),
    origin: "2025-02-13",
    startDate: "2025-02-13",
    sec: { cik: 2023554 },
  },
  {
    id: "samsung",
    symbol: "005930.KS",
    name: "Samsung Electronics",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "The world's largest memory maker (HBM and NAND for AI servers) and a foundry rival to TSMC, plus phones and displays. Quoted in KRW on the Korea Exchange.",
    price: { kind: "naver", symbol: "005930", fallback: { kind: "yahoo", symbol: "005930.KS" } },
    quote: "KRW",
    origin: "1990-01-03",
    // Naver's Jan–Feb 1990 rows are pre-split (≈44,000 KRW); adjusted values start 1990-03-02 (423 KRW).
    startDate: "1990-03-02",
  },
  {
    id: "avgo",
    symbol: "AVGO",
    name: "Broadcom",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "Designs the custom AI accelerators (XPUs) for Google, Meta and OpenAI, plus the Ethernet switch silicon that networks GPU clusters. Also owns VMware.",
    price: stock("AVGO"),
    origin: "2009-08-06",
    sec: { cik: 1730168 },
  },
  {
    id: "tsm",
    symbol: "TSM",
    name: "TSMC",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "The foundry that manufactures essentially every leading-edge AI chip, from NVIDIA and AMD GPUs to Apple and Google silicon, and packages them with CoWoS. US-listed ADR.",
    price: stock("TSM"),
    origin: "1997-10-08",
    sec: { cik: 1046179 },
  },
  {
    id: "asml",
    symbol: "ASML",
    name: "ASML",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "Sole supplier of the EUV lithography machines that TSMC, Samsung and Intel need for leading-edge nodes. The choke point of the chip supply chain. US-listed shares.",
    price: stock("ASML"),
    origin: "1995-03-15",
    sec: { cik: 937966 },
  },
  {
    id: "intc",
    symbol: "INTC",
    name: "Intel",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "x86 CPU maker attempting a foundry turnaround (18A) with US government backing. Tracked as the domestic manufacturing alternative to TSMC.",
    price: stock("INTC"),
    origin: "1971-10-13",
    sec: { cik: 50863 },
  },
  {
    id: "arm",
    symbol: "ARM",
    name: "Arm Holdings",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "Licenses the CPU architecture in nearly every phone and in the data-centre chips of NVIDIA (Grace), AWS (Graviton), Microsoft and Google. Listed September 2023.",
    price: stock("ARM"),
    origin: "2023-09-14",
    startDate: "2023-09-14",
    sec: { cik: 1973239 },
  },
  {
    id: "smci",
    symbol: "SMCI",
    name: "Super Micro Computer",
    ...EQUITY,
    sector: "Semiconductors",
    about:
      "Builds the GPU servers and liquid-cooled racks that hyperscalers and AI labs deploy NVIDIA and AMD accelerators in. A direct read on AI-server shipments.",
    price: stock("SMCI"),
    origin: "2007-03-29",
    sec: { cik: 1375365 },
  },

  // ------------------------------------------- AI infrastructure & power
  {
    id: "cat",
    symbol: "CAT",
    name: "Caterpillar",
    ...EQUITY,
    sector: "AI infrastructure & power",
    about:
      "Heavy-equipment maker whose Power Systems unit supplies the diesel and gas generator sets, turbines and backup power that data centres install behind the meter.",
    price: stock("CAT"),
    origin: "1962-01-02",
    sec: { cik: 18230 },
  },
  {
    id: "vst",
    symbol: "VST",
    name: "Vistra",
    ...EQUITY,
    sector: "AI infrastructure & power",
    about:
      "Independent power producer with nuclear (Comanche Peak, the former Energy Harbor fleet) and gas plants, signing long-term power agreements with data-centre operators. Relisted 2016 after Energy Future Holdings' bankruptcy.",
    price: stock("VST"),
    origin: "2016-11-07",
    startDate: "2016-11-07",
    sec: { cik: 1692819 },
  },
  {
    id: "ceg",
    symbol: "CEG",
    name: "Constellation Energy",
    ...EQUITY,
    sector: "AI infrastructure & power",
    about:
      "The largest US nuclear operator; sells carbon-free power under multi-year PPAs to Microsoft (Three Mile Island restart) and other hyperscalers. Spun out of Exelon in January 2022.",
    price: stock("CEG"),
    origin: "2022-01-19",
    startDate: "2022-01-19",
    sec: { cik: 1868275 },
  },
  {
    id: "gev",
    symbol: "GEV",
    name: "GE Vernova",
    ...EQUITY,
    sector: "AI infrastructure & power",
    about:
      "GE's spun-out energy business: gas turbines, grid equipment and wind. Its gas-turbine order book is sold out years ahead on data-centre and grid demand. Listed March 2024.",
    price: stock("GEV"),
    origin: "2024-03-27",
    startDate: "2024-03-27",
    sec: { cik: 1996810 },
  },
  {
    id: "etn",
    symbol: "ETN",
    name: "Eaton",
    ...EQUITY,
    sector: "AI infrastructure & power",
    about:
      "Electrical-equipment maker supplying the switchgear, UPS systems, busways and power distribution inside data centres and the grid connections feeding them.",
    price: stock("ETN"),
    origin: "1962-01-02",
    sec: { cik: 1551182 },
  },
  {
    id: "vrt",
    symbol: "VRT",
    name: "Vertiv",
    ...EQUITY,
    sector: "AI infrastructure & power",
    about:
      "Makes the liquid cooling, thermal management, power distribution and rack infrastructure for GPU data centres. Series starts at the February 2020 merger; the SPAC shell before it is dropped.",
    price: stock("VRT"),
    origin: "2020-02-07",
    startDate: "2020-02-07",
    sec: { cik: 1674101 },
  },

  // ------------------------------------------------------- Software & data
  {
    id: "pltr",
    symbol: "PLTR",
    name: "Palantir",
    ...EQUITY,
    sector: "Software & data",
    about:
      "Data-integration and AI platform (Foundry, Gotham, AIP) for governments and enterprises. The software name most tied to AI-adoption sentiment. Direct listing September 2020.",
    price: stock("PLTR"),
    origin: "2020-09-30",
    startDate: "2020-09-30",
    sec: { cik: 1321655 },
  },

  // --------------------------------------------------------------- indices
  {
    id: "spx",
    symbol: "SPX",
    name: "S&P 500",
    ...INDEX,
    sector: "Indices",
    about:
      "Market-cap-weighted index of 500 large US companies; the default benchmark for equities and for BTC's correlation to risk assets.",
    price: { kind: "yahoo", symbol: "^GSPC", fallback: { kind: "cboe", file: "SPX_History.csv" } },
    origin: "1975-01-02",
    benchmark: "ndx",
  },
  {
    id: "ndx",
    symbol: "NDX",
    name: "Nasdaq-100",
    ...INDEX,
    sector: "Indices",
    about:
      "The 100 largest non-financial Nasdaq companies, dominated by the AI and big-tech names tracked here.",
    price: { kind: "yahoo", symbol: "^NDX", fallback: { kind: "nasdaq", symbol: "NDX", assetclass: "index" } },
    origin: "1985-10-01",
  },
  {
    id: "ixic",
    symbol: "IXIC",
    name: "Nasdaq Composite",
    ...INDEX,
    sector: "Indices",
    about: "Every stock listed on Nasdaq, roughly 3,000 names; the broadest gauge of US growth and tech equities.",
    price: { kind: "yahoo", symbol: "^IXIC", fallback: { kind: "nasdaq", symbol: "COMP", assetclass: "index" } },
    origin: "1971-02-05",
  },
];

export function byId(id: string): AssetDef | undefined {
  return ASSETS.find((a) => a.id === id);
}

/** Every asset with a daily price feed (crypto, equities and indices). */
export const TRADEABLE = ASSETS.filter((a) => a.price.kind !== "none");
/** Binance-fed coins — what TRADEABLE meant before equities were added. */
export const CRYPTO_TRADEABLE = TRADEABLE.filter((a) => a.class === "crypto");
export const FULL_SUITE = ASSETS.filter((a) => a.suite === "full");
export const STABLES = ASSETS.filter((a) => a.stable);
