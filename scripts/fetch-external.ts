/**
 * Small external series (sentiment, macro) — refetched in full daily since
 * they're tiny. Runs in the cron between data:update and data:compute.
 */
import fs from "node:fs";
import path from "node:path";
import { lastClosedUtcDate, toUtcDate } from "./lib/marketData";

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (burrito)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function write(rel: string, data: unknown) {
  const file = path.join(process.cwd(), "data", "raw", rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

/** alternative.me crypto Fear & Greed — full history, 0 (fear) to 100 (greed). */
async function fearGreed() {
  const body = await getJson("https://api.alternative.me/fng/?limit=0&format=json");
  const rows = (body.data as any[])
    .map((d) => ({ date: toUtcDate(Number(d.timestamp) * 1000), value: Number(d.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  write("fear-greed.json", { updatedAt: new Date().toISOString(), rows });
  console.log(`fear-greed: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date})`);
}

/** DXY daily closes via Yahoo chart API (ICE dollar index). */
async function dxy() {
  // period1/period2 keeps daily granularity; range=max silently coarsens it
  const body = await getJson(
    "https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?period1=0&period2=9999999999&interval=1d",
  );
  const r = body.chart.result[0];
  const closes = r.indicators.quote[0].close as (number | null)[];
  const cutoff = lastClosedUtcDate();
  const rows = (r.timestamp as number[])
    .map((t, i) => ({
      date: toUtcDate(t * 1000),
      close: closes[i] === null ? null : Number(closes[i]!.toFixed(3)),
    }))
    .filter((x): x is { date: string; close: number } => x.close !== null && x.date <= cutoff);
  write("dxy/daily.json", { updatedAt: new Date().toISOString(), rows });
  console.log(`dxy: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date})`);
}

/** Fed total assets (WALCL, weekly, $ millions → billions) via FRED. */
async function fedAssets() {
  let key = process.env.FRED_API_KEY;
  if (!key) {
    // local convenience: read .env.local (gitignored)
    try {
      const env = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
      key = env.match(/^FRED_API_KEY=(.+)$/m)?.[1]?.trim();
    } catch {}
  }
  if (!key) {
    console.warn("fed-assets: FRED_API_KEY not set — skipping");
    return;
  }
  const body = await getJson(
    `https://api.stlouisfed.org/fred/series/observations?series_id=WALCL&api_key=${key}&file_type=json`,
  );
  const rows = (body.observations as any[])
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date as string, value: Number((Number(o.value) / 1000).toFixed(1)) }));
  write("fed-assets.json", { updatedAt: new Date().toISOString(), unit: "USD billions", rows });
  console.log(`fed-assets: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date})`);
}

async function main() {
  const results = await Promise.allSettled([fearGreed(), dxy(), fedAssets()]);
  const failed = results.filter((r) => r.status === "rejected");
  for (const f of failed) console.error("fetch failed:", (f as PromiseRejectedResult).reason);
  // partial failure is fine (stale file stays); total failure should fail the job
  if (failed.length === results.length) process.exit(1);
}

main();
