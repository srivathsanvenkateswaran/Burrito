import fs from "node:fs";
import path from "node:path";

export interface DailyRow {
  date: string; // YYYY-MM-DD (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUsd: number;
}

export interface DailySeries {
  asset: string;
  quote: string;
  updatedAt: string;
  rows: DailyRow[];
}

const DAY_MS = 86_400_000;

export function toUtcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Last fully closed UTC day (today's candle is still forming). */
export function lastClosedUtcDate(): string {
  return toUtcDate(Date.now() - DAY_MS);
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/**
 * blockchain.info market-price — free, no key, daily average BTC price back
 * to 2010. Close-only (OHLC collapsed to the daily price, volume unknown);
 * used for pre-Binance history and as an update fallback. BTC only.
 */
export async function fetchBlockchainInfoDaily(): Promise<DailyRow[]> {
  const url =
    "https://api.blockchain.info/charts/market-price?timespan=all&format=json&sampled=false";
  const body = await getJson(url);
  if (body.status !== "ok") throw new Error(`blockchain.info: ${JSON.stringify(body).slice(0, 200)}`);
  return (body.values as { x: number; y: number }[])
    .filter((v) => v.y > 0)
    .map((v) => ({
      date: toUtcDate(v.x * 1000),
      open: v.y,
      high: v.y,
      low: v.y,
      close: v.y,
      volumeUsd: 0,
    }));
}

/**
 * Binance klines — free, no key, daily candles since listing (~2017-08 for BTC).
 * Preferred source where available; paginated 1000 candles per call.
 */
export async function fetchBinanceDaily(
  symbol: string,
  startDate: string,
): Promise<DailyRow[]> {
  const rows: DailyRow[] = [];
  let start = Date.parse(`${startDate}T00:00:00Z`);
  for (;;) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=1000&startTime=${start}`;
    const batch = (await getJson(url)) as any[];
    if (batch.length === 0) break;
    for (const k of batch) {
      rows.push({
        date: toUtcDate(k[0]),
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volumeUsd: Number(k[7]), // quote-asset volume
      });
    }
    if (batch.length < 1000) break;
    start = batch[batch.length - 1][0] + DAY_MS;
  }
  return rows;
}

/** Merge sources by date; rows from `preferred` win on conflicts. */
export function mergeRows(base: DailyRow[], preferred: DailyRow[]): DailyRow[] {
  const byDate = new Map<string, DailyRow>();
  for (const r of base) byDate.set(r.date, r);
  for (const r of preferred) byDate.set(r.date, r);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function seriesPath(asset: string): string {
  return path.join(process.cwd(), "data", "raw", asset.toLowerCase(), "daily.json");
}

export function readSeries(asset: string): DailySeries | null {
  const file = seriesPath(asset);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeSeries(series: DailySeries): void {
  const file = seriesPath(series.asset);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // One row per line keeps git diffs to exactly the appended days.
  const rows = series.rows.map((r) => `    ${JSON.stringify(r)}`).join(",\n");
  const head = JSON.stringify(
    { asset: series.asset, quote: series.quote, updatedAt: series.updatedAt },
    null,
    2,
  ).slice(0, -2);
  fs.writeFileSync(file, `${head},\n  "rows": [\n${rows}\n  ]\n}\n`);
}
