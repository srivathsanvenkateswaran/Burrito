/**
 * Cross-asset layer spanning crypto, equities and indices →
 *  - data/metrics/correlations-cross.json (90-trading-day Pearson matrix +
 *    rolling 90d series for a few headline pairs)
 *  - data/metrics/cross-asset.json (closes normalized to 100 at a base date)
 * The crypto-only aggregates in compute-assets.ts are untouched by this file.
 */
import fs from "node:fs";
import path from "node:path";
import { jsonLines } from "./lib/computeAsset";
import { readSeries } from "./lib/marketData";
import { roundSig } from "./lib/metrics";

const dir = path.join(process.cwd(), "data", "metrics");
const WINDOW = 90;

const CANDIDATE_IDS = [
  "btc",
  "eth",
  "sol",
  "spx",
  "ndx",
  "ixic",
  "nvda",
  "aapl",
  "msft",
  "googl",
  "amzn",
  "meta",
  "tsla",
  "spcx",
];

/** date → ln(close[t]/close[t-1]) for one asset. */
function logReturns(id: string): Map<string, number> | null {
  const series = readSeries(id);
  if (!series || series.rows.length < 2) return null;
  const m = new Map<string, number>();
  for (let i = 1; i < series.rows.length; i++) {
    const prev = series.rows[i - 1].close;
    const cur = series.rows[i].close;
    if (prev > 0 && cur > 0) m.set(series.rows[i].date, Math.log(cur / prev));
  }
  return m;
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : null;
}

/** Dates present in both return maps, ascending. */
function commonDates(a: Map<string, number>, b: Map<string, number>): string[] {
  const out: string[] = [];
  for (const d of a.keys()) if (b.has(d)) out.push(d);
  return out.sort();
}

function windowPearson(
  a: Map<string, number>,
  b: Map<string, number>,
  common: string[],
  endIdx: number,
  window: number,
): number | null {
  const start = endIdx - window + 1;
  if (start < 0) return null;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = start; i <= endIdx; i++) {
    xs.push(a.get(common[i])!);
    ys.push(b.get(common[i])!);
  }
  return pearson(xs, ys);
}

function computeCorrelationsCross(): string[] {
  const returns = new Map<string, Map<string, number>>();
  const ids: string[] = [];
  for (const id of CANDIDATE_IDS) {
    if (id === "spcx") {
      const series = readSeries("spcx");
      if (!series || series.rows.length < 120) {
        console.log("spcx: omitted from correlations-cross (< 120 rows)");
        continue;
      }
    }
    const m = logReturns(id);
    if (!m) {
      console.log(`${id}: no raw series, omitted from correlations-cross`);
      continue;
    }
    returns.set(id, m);
    ids.push(id);
  }
  if (fs.existsSync(path.join(process.cwd(), "data", "raw", "dxy", "daily.json"))) {
    const m = logReturns("dxy");
    if (m) {
      returns.set("dxy", m);
      ids.push("dxy");
    }
  }

  const matrix: (number | null)[][] = ids.map((a) =>
    ids.map((b) => {
      if (a === b) return 1;
      const common = commonDates(returns.get(a)!, returns.get(b)!);
      const last = common.slice(-WINDOW);
      if (last.length < WINDOW) return null;
      const xs = last.map((d) => returns.get(a)!.get(d)!);
      const ys = last.map((d) => returns.get(b)!.get(d)!);
      return roundSig(pearson(xs, ys), 6);
    }),
  );

  const rollingPairs: [string, string][] = [
    ["btc", "spx"],
    ["btc", "ndx"],
    ["eth", "ndx"],
    ["btc", "nvda"],
  ];
  const rolling: Record<string, { date: string; value: number }[]> = {};
  for (const [a, b] of rollingPairs) {
    const ra = returns.get(a);
    const rb = returns.get(b);
    const key = `${a}-${b}`;
    if (!ra || !rb) {
      rolling[key] = [];
      continue;
    }
    const common = commonDates(ra, rb);
    const series: { date: string; value: number }[] = [];
    for (let i = WINDOW - 1; i < common.length; i++) {
      const v = windowPearson(ra, rb, common, i, WINDOW);
      if (v !== null) series.push({ date: common[i], value: roundSig(v, 6)! });
    }
    rolling[key] = series;
  }

  fs.writeFileSync(
    path.join(dir, "correlations-cross.json"),
    jsonLines({ updatedAt: new Date().toISOString(), ids, matrix, rolling }),
  );
  console.log(`correlations-cross: ${ids.length}x${ids.length} ids=[${ids.join(",")}]`);
  for (const [a, b] of rollingPairs) {
    console.log(`  rolling ${a}-${b}: ${rolling[`${a}-${b}`].length} points`);
  }
  return ids;
}

const NORM_IDS = ["btc", "eth", "spx", "ndx", "nvda", "aapl", "tsla"];
const BASES = ["2020-01-01", "2023-01-01"];

function computeCrossAsset(): void {
  const seriesById = new Map<string, { date: string; close: number }[]>();
  for (const id of NORM_IDS) {
    const s = readSeries(id);
    if (s) seriesById.set(id, s.rows);
  }

  const bases: Record<string, { rows: Record<string, number | string | null>[] }> = {};
  for (const base of BASES) {
    const baseValue = new Map<string, number>();
    const closeByDate = new Map<string, Map<string, number>>();
    for (const id of NORM_IDS) {
      const rows = seriesById.get(id);
      if (!rows) continue;
      const idx = rows.findIndex((r) => r.date >= base);
      if (idx === -1) continue;
      baseValue.set(id, rows[idx].close);
      const m = new Map<string, number>();
      for (let i = idx; i < rows.length; i++) m.set(rows[i].date, rows[i].close);
      closeByDate.set(id, m);
    }
    const dateSet = new Set<string>();
    for (const m of closeByDate.values()) for (const d of m.keys()) dateSet.add(d);
    const dates = [...dateSet].sort();
    const rows = dates.map((date) => {
      const row: Record<string, number | string | null> = { date };
      for (const id of NORM_IDS) {
        const bv = baseValue.get(id);
        const c = closeByDate.get(id)?.get(date);
        row[id] = bv !== undefined && c !== undefined ? roundSig((c / bv) * 100, 6) : null;
      }
      return row;
    });
    bases[base] = { rows };
    console.log(`cross-asset base ${base}: ${rows.length} rows`);
  }

  fs.writeFileSync(
    path.join(dir, "cross-asset.json"),
    jsonLines({ updatedAt: new Date().toISOString(), bases }),
  );
}

function main() {
  const t0 = Date.now();
  computeCrossAsset();
  const ids = computeCorrelationsCross();
  console.log(`compute-cross done in ${((Date.now() - t0) / 1000).toFixed(1)}s (${ids.length} correlation ids)`);
}

main();
