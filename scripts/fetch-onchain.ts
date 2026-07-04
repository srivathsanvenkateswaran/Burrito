/**
 * Daily on-chain metrics for btc/eth from the Coin Metrics Community API.
 * Full refetch every run (idempotent, cron-friendly): all metrics for one
 * asset are requested in a single timeseries call (one row per date, one
 * column per metric), pages followed sequentially with a polite delay to
 * stay under the community rate limit (~10 req / 6 s per IP).
 *
 * Metric coverage was verified against catalog-v2 (community tier, 1d):
 * CapRealUSD, FeeTotUSD, TxTfrValAdjUSD, IssContPctAnn, RevUSD, NVTAdj,
 * NVTAdj90, VelCur1yr, CDD* and SplyAct* are NOT on the free tier.
 * CapMVRVCur is, so realized cap is derivable (CapMrktCurUSD / CapMVRVCur),
 * and FeeTotUSD is derivable (FeeTotNtv * PriceUSD).
 *
 * Output: data/raw/onchain/<asset>.json
 *   { updatedAt, metrics, rows: [{ date, <MetricName>: number|null, ... }] }
 *   ascending, excluding today's (UTC) still-forming values.
 *   Rounding: USD & counts to whole numbers, supply to whole units,
 *   ratios/native-unit values to 6 significant digits.
 */
import fs from "node:fs";
import path from "node:path";
import { toUtcDate } from "./lib/marketData";

const API = "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics";
const DELAY_MS = 700; // ~8.5 req / 6 s, under the ~10 req / 6 s community limit

const ASSETS = ["btc", "eth"] as const;

// Verified available at 1d on the community tier for both btc and eth.
const METRICS = [
  "AdrActCnt", // active addresses
  "AdrBalCnt", // addresses with balance
  "BlkCnt", // blocks per day
  "CapMVRVCur", // MVRV ratio (market cap / realized cap)
  "CapMrktCurUSD", // market cap
  "FeeTotNtv", // total fees, native units
  "FlowInExNtv", // exchange inflow, native
  "FlowInExUSD", // exchange inflow, USD
  "FlowOutExNtv", // exchange outflow, native
  "FlowOutExUSD", // exchange outflow, USD
  "HashRate", // mean hash rate
  "IssTotNtv", // issuance, native units
  "IssTotUSD", // issuance, USD
  "PriceUSD", // CM reference price
  "SplyCur", // current supply
  "SplyExNtv", // supply on exchanges, native
  "SplyExUSD", // supply on exchanges, USD
  "SplyExpFut10yr", // expected supply 10y out
  "TxCnt", // transactions
  "TxTfrCnt", // transfers
] as const;

type MetricName = (typeof METRICS)[number];

// Whole numbers: USD values and counts.
const WHOLE_USD_OR_COUNT = new Set<MetricName>([
  "AdrActCnt",
  "AdrBalCnt",
  "BlkCnt",
  "CapMrktCurUSD",
  "FlowInExUSD",
  "FlowOutExUSD",
  "IssTotUSD",
  "PriceUSD",
  "SplyExUSD",
  "TxCnt",
  "TxTfrCnt",
]);
// Whole units: supply.
const WHOLE_SUPPLY = new Set<MetricName>(["SplyCur", "SplyExNtv", "SplyExpFut10yr"]);
// Everything else (ratios, hash rate, native-unit flows/fees/issuance): 6 sig digits.

type Row = { date: string } & Partial<Record<MetricName, number | null>>;

let requestCount = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (burrito)" },
    });
    requestCount++;
    if (res.status === 429 && attempt < 3) {
      await sleep(6000); // rate-limited: wait out the window and retry
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return res.json();
  }
}

function round(metric: MetricName, value: number): number {
  if (WHOLE_USD_OR_COUNT.has(metric) || WHOLE_SUPPLY.has(metric)) return Math.round(value);
  if (value === 0) return 0;
  return Number(value.toPrecision(6)); // 6 significant digits
}

function write(asset: string, rows: Row[]) {
  const file = path.join(process.cwd(), "data", "raw", "onchain", `${asset}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify({ updatedAt: new Date().toISOString(), metrics: METRICS, rows }),
  );
  return file;
}

/** Fetch full daily history of all metrics for one asset (wide rows). */
async function fetchAsset(asset: string): Promise<Row[]> {
  const rows: Row[] = [];
  const today = toUtcDate(Date.now());
  let url: string | undefined =
    `${API}?assets=${asset}&metrics=${METRICS.join(",")}&frequency=1d` +
    `&page_size=10000&paging_from=start`;
  while (url) {
    const body = await getJson(url);
    for (const r of body.data as any[]) {
      const date = (r.time as string).slice(0, 10);
      if (date >= today) continue; // skip today's partial values
      const row: Row = { date };
      for (const m of METRICS) {
        const v = r[m];
        row[m] = v == null ? null : round(m, Number(v));
      }
      rows.push(row);
    }
    url = body.next_page_url;
    if (url) await sleep(DELAY_MS);
  }
  return rows.sort((x, y) => x.date.localeCompare(y.date));
}

async function main() {
  let failures = 0;
  for (const [i, asset] of ASSETS.entries()) {
    try {
      const rows = await fetchAsset(asset);
      if (rows.length === 0) {
        console.warn(`${asset}: no rows returned`);
        failures++;
        continue;
      }
      const file = write(asset, rows);
      console.log(
        `${asset}: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date}) → ${file}`,
      );
    } catch (err) {
      failures++;
      console.error(`${asset} failed:`, err);
    }
    if (i < ASSETS.length - 1) await sleep(DELAY_MS);
  }
  console.log(`done: ${requestCount} requests`);
  // partial failure is fine (stale files stay); total failure should fail the job
  if (failures === ASSETS.length) process.exit(1);
}

main();
