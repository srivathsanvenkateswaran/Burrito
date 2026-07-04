import fs from "node:fs";
import path from "node:path";
import type { MetricRow } from "@/components/PriceChart";
import type { MonthlyReturn } from "@/components/MonthlyHeatmap";
import type { YearSeries } from "@/components/YtdRoiChart";

export interface FullMetricRow extends MetricRow {
  risk: number | null;
  mayer: number | null;
  rsi14: number | null;
  roi1y: number | null;
}

export interface MetricsFile {
  updatedThrough: string;
  rows: FullMetricRow[];
}

function loadJson<T>(...segments: string[]): T {
  const file = path.join(process.cwd(), "data", ...segments);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function loadMetrics(asset = "btc"): MetricsFile {
  return loadJson<MetricsFile>("metrics", asset, "daily.json");
}

export function loadMonthlyReturns(asset = "btc"): MonthlyReturn[] {
  return loadJson<MonthlyReturn[]>("metrics", asset, "monthly-returns.json");
}

export function loadYtdRoi(asset = "btc"): YearSeries[] {
  return loadJson<YearSeries[]>("metrics", asset, "ytd-roi.json");
}

export function loadFearGreed(): { rows: { date: string; value: number }[] } {
  return loadJson("raw", "fear-greed.json");
}

export function loadDxy(): { rows: { date: string; close: number }[] } {
  return loadJson("raw", "dxy", "daily.json");
}

export function loadFedAssets(): { rows: { date: string; value: number }[] } {
  return loadJson("raw", "fed-assets.json");
}

export interface AssetSummary {
  id: string;
  symbol: string;
  name: string;
  close: number;
  chg24h: number;
  roi30d: number | null;
  roi1y: number | null;
  mcap: number | null;
  risk: number;
  shortHistory: boolean;
  mayer: number | null;
  above20w: boolean | null;
  maStrength?: { p20: boolean; s20_50: boolean; s50_100: boolean; s100_200: boolean };
  stale: boolean;
}

export function loadAssetsSummary(): { updatedAt: string; assets: AssetSummary[] } {
  return loadJson("metrics", "assets-summary.json");
}

export interface McapAggRow {
  date: string;
  total: number;
  btcDom: number;
  ethDom: number;
  alt: number;
  altExEthStables: number;
  ssr: number | null;
  fair: number;
  fairLow: number;
  fairHigh: number;
}

export function loadMcapAggregates(): { rows: McapAggRow[] } {
  return loadJson("metrics", "mcap-aggregates.json");
}

export function loadAltseason(): { rows: { date: string; value: number }[] } {
  return loadJson("metrics", "altseason.json");
}

export function loadAssetDaily(id: string): { rows: { date: string; close: number }[] } {
  return loadJson("raw", id, "daily.json");
}

export function loadBreadth(): {
  rows: {
    date: string;
    adv: number;
    dec: number;
    advPct: number | null;
    adi: number;
    abi: number;
    above20wPct: number | null;
  }[];
} {
  return loadJson("metrics", "breadth.json");
}

export function loadPortfolios(): {
  rows: { date: string; top5: number; top10: number; top20: number; btc: number }[];
} {
  return loadJson("metrics", "portfolios.json");
}

export function loadCorrelations(): { ids: string[]; matrix: (number | null)[][] } {
  return loadJson("metrics", "correlations.json");
}

export interface ComparisonLine {
  id: string;
  points: { day: number; mult: number }[];
}

export function loadComparisons(): {
  anchors: { bottom: string; peak: string; ethBottoms: string[] };
  fromBottom: ComparisonLine[];
  fromPeak: ComparisonLine[];
  pairsFromBottom: ComparisonLine[];
  pairsFromPeak: ComparisonLine[];
  inception: ComparisonLine[];
  pairsInception: ComparisonLine[];
  ethSubCycle: ComparisonLine[];
} {
  return loadJson("metrics", "comparisons.json");
}

export interface OnchainBtcRow {
  date: string;
  mvrv: number | null;
  mvrvZ: number | null;
  nupl: number | null;
  rcap: number | null;
  puell: number | null;
  s2f: number | null;
  issUsd: number | null;
  inflPct: number | null;
  thermo: number | null;
  mctc: number | null;
  rctc: number | null;
  hashRate: number | null;
  hashSma30: number | null;
  hashSma60: number | null;
  hashOverPrice: number | null;
  minerRev: number | null;
  feesUsd: number | null;
  adrAct: number | null;
  txCnt: number | null;
  txTfrCnt: number | null;
  blkCnt: number | null;
  blockSizeMb: number | null;
  utxoCount: number | null;
  splyExNtv: number | null;
  flowInExUsd: number | null;
  flowOutExUsd: number | null;
  flowNetExUsd: number | null;
  splyCur: number | null;
  price: number | null;
}

export function loadOnchainBtc(): {
  ribbonEvents: { date: string; type: "up" | "down" }[];
  rows: OnchainBtcRow[];
} {
  return loadJson("metrics", "onchain-btc.json");
}

export interface OnchainEthRow {
  date: string;
  adrAct: number | null;
  feesUsd: number | null;
  splyCur: number | null;
  issNtv: number | null;
  mvrv: number | null;
  splyExNtv: number | null;
  txCnt: number | null;
}

export function loadOnchainEth(): { rows: OnchainEthRow[] } {
  return loadJson("metrics", "onchain-eth.json");
}

export function loadWiki(article: string): { rows: { date: string; views: number }[] } {
  return loadJson("raw", "wiki", `${article}.json`);
}

export function loadFred(id: string): { fredId: string; rows: { date: string; value: number }[] } {
  return loadJson("raw", "fred", `${id}.json`);
}

export function loadDerivs<T = Record<string, number | string>>(file: string): { rows: (T & { date: string })[] } {
  return loadJson("raw", "derivs", `${file}.json`);
}

/** Year-over-year % change for monthly FRED series. */
export function yoy(rows: { date: string; value: number }[]): { date: string; value: number }[] {
  return rows.flatMap((r, i) =>
    i < 12 ? [] : [{ date: r.date, value: Number(((r.value / rows[i - 12].value - 1) * 100).toFixed(2)) }],
  );
}

export function onchainPoints<T extends { date: string }>(
  rows: T[],
  pick: (r: T) => number | null,
  fromDate = "",
): { date: string; value: number }[] {
  return rows.flatMap((r) => {
    const v = pick(r);
    return v === null || r.date < fromDate ? [] : [{ date: r.date, value: v }];
  });
}

export interface FanFile {
  taus: number[];
  rows: { date: string; q: number[] }[];
}

export function loadFan(asset = "btc"): FanFile {
  return loadJson("metrics", asset, "fan.json");
}

export interface EventRoiFile {
  halvings: { label: string; points: { day: number; pct: number }[] }[];
  bottoms: { label: string; points: { day: number; pct: number }[] }[];
  peaks: { label: string; points: { day: number; pct: number }[] }[];
  latestPeak: { label: string; points: { day: number; pct: number }[] }[];
  deviation: { day: number; pct: number }[];
}

export function loadEventRoi(asset = "btc"): EventRoiFile {
  return loadJson("metrics", asset, "event-roi.json");
}

export function loadRoiBands(asset = "btc"): { multiple: number; days: (number | null)[] }[] {
  return loadJson("metrics", asset, "roi-bands.json");
}

export interface TaRow {
  date: string;
  close: number;
  drawdown: number | null;
  vol30: number | null;
  vol60: number | null;
  vol180: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  bbUpper: number | null;
  bbMid: number | null;
  bbLower: number | null;
  sma50d: number | null;
  sma200d: number | null;
  sma111d: number | null;
  sma350x2: number | null;
  bubble: number | null;
  stUp: number | null;
  stDown: number | null;
}

export function loadTa(asset = "btc"): { rows: TaRow[] } {
  return loadJson("metrics", asset, "ta.json");
}

export interface CrossEvent {
  date: string;
  type: "up" | "down";
}

export function loadEvents(asset = "btc"): { goldenDeath: CrossEvent[]; piCycle: CrossEvent[] } {
  return loadJson("metrics", asset, "events.json");
}

export interface DaysSinceFile {
  dates: string[];
  declines: { threshold: number; days: number[] }[];
  gains: { threshold: number; days: number[] }[];
}

export function loadDaysSince(asset = "btc"): DaysSinceFile {
  return loadJson("metrics", asset, "days-since.json");
}

export interface DistributionsFile {
  benford: { digit: number; actual: number; expected: number }[];
  milestones: { date: string; level: number }[];
  quarterly: { year: number; quarter: number; pct: number }[];
  avgDaily: { day: number; avg: number }[];
  riskLevels: { risk: number; price: number }[];
  dcaWeekday: { dow: number; avgExt: number }[];
  smaTopBreakouts: { date: string; prevTop: number }[];
  cyclePeaks: string[];
}

export function loadDistributions(asset = "btc"): DistributionsFile {
  return loadJson("metrics", asset, "distributions.json");
}

export function taPoints(
  rows: TaRow[],
  pick: (r: TaRow) => number | null,
  fromDate = "",
): { date: string; value: number }[] {
  return rows.flatMap((r) => {
    const v = pick(r);
    return v === null || r.date < fromDate ? [] : [{ date: r.date, value: v }];
  });
}

export function metricPoints(
  rows: FullMetricRow[],
  pick: (r: FullMetricRow) => number | null,
  fromDate = "",
): { date: string; value: number }[] {
  return rows.flatMap((r) => {
    const v = pick(r);
    return v === null || r.date < fromDate ? [] : [{ date: r.date, value: v }];
  });
}
