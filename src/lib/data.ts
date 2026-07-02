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
