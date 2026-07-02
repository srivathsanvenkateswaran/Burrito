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
