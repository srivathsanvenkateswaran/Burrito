/**
 * Derives all metric series from raw data → data/metrics/<asset>/.
 * Rerun any time formulas change; raw data is never touched.
 * Weekly MAs are approximated on daily closes (20W ≈ 140d, 21W ≈ 147d, etc.).
 */
import fs from "node:fs";
import path from "node:path";
import { readSeries } from "./lib/marketData";
import {
  ema,
  fitLogRegression,
  monthlyReturns,
  riskMetric,
  rsi,
  sma,
} from "./lib/metrics";

const BTC_GENESIS = Date.parse("2009-01-03T00:00:00Z");
const DAY_MS = 86_400_000;

function round(v: number | null, digits: number): number | null {
  return v === null ? null : Number(v.toFixed(digits));
}

function main() {
  const series = readSeries("BTC");
  if (!series) throw new Error("Run `npm run data:backfill` first.");
  const rows = series.rows;
  const closes = rows.map((r) => r.close);
  const days = rows.map(
    (r) => (Date.parse(`${r.date}T00:00:00Z`) - BTC_GENESIS) / DAY_MS,
  );

  const reg = fitLogRegression(days, closes);
  const fairs = days.map((t) => reg.fair(t));
  const risk = riskMetric(closes, fairs);
  const sma20w = sma(closes, 140);
  const ema21w = ema(closes, 147);
  const sma50w = sma(closes, 350);
  const sma200w = sma(closes, 1400);
  const sma200d = sma(closes, 200);
  const rsi14 = rsi(closes, 14);

  const daily = rows.map((r, i) => ({
    date: r.date,
    close: r.close,
    fair: round(fairs[i], 2),
    bandLow: round(fairs[i] * Math.exp(-reg.sigma), 2),
    bandHigh: round(fairs[i] * Math.exp(reg.sigma), 2),
    risk: round(risk[i], 3),
    sma20w: round(sma20w[i], 2),
    ema21w: round(ema21w[i], 2),
    sma50w: round(sma50w[i], 2),
    sma200w: round(sma200w[i], 2),
    mayer: round(sma200d[i] === null ? null : closes[i] / sma200d[i]!, 3),
    rsi14: round(rsi14[i], 1),
    roi1y: round(i < 365 ? null : (closes[i] / closes[i - 365] - 1) * 100, 1),
  }));

  const dir = path.join(process.cwd(), "data", "metrics", "btc");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "daily.json"),
    `{\n"updatedThrough": ${JSON.stringify(rows.at(-1)!.date)},\n"regression": ${JSON.stringify(
      { slope: reg.slope, intercept: reg.intercept, sigma: reg.sigma },
    )},\n"rows": [\n${daily.map((d) => JSON.stringify(d)).join(",\n")}\n]\n}\n`,
  );
  fs.writeFileSync(
    path.join(dir, "monthly-returns.json"),
    JSON.stringify(monthlyReturns(rows)),
  );

  const latest = daily.at(-1)!;
  console.log(
    `BTC metrics through ${latest.date}: close=$${latest.close} fair=$${latest.fair} risk=${latest.risk} mayer=${latest.mayer} rsi=${latest.rsi14}`,
  );
}

main();
