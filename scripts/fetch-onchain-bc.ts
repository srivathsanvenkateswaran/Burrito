/**
 * Bitcoin mining/network series from the blockchain.com charts API (free, no
 * key). Full history refetched each run — files are small. One JSON file per
 * chart under data/raw/onchain-bc/.
 */
import fs from "node:fs";
import path from "node:path";
import { lastClosedUtcDate, toUtcDate } from "./lib/marketData";

const CHARTS: { name: string; unit: string; optional?: boolean }[] = [
  { name: "hash-rate", unit: "TH/s" },
  { name: "miners-revenue", unit: "USD/day" },
  { name: "transaction-fees-usd", unit: "USD/day" },
  { name: "n-transactions", unit: "tx/day" },
  { name: "n-unique-addresses", unit: "addresses/day" },
  { name: "avg-block-size", unit: "MB" },
  // limited history / may not exist — skip quietly on failure
  { name: "mempool-size", unit: "bytes", optional: true },
  { name: "utxo-count", unit: "UTXOs", optional: true },
];

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchChart(chart: { name: string; unit: string }) {
  const body = await getJson(
    `https://api.blockchain.info/charts/${chart.name}?timespan=all&format=json&sampled=false`,
  );
  const values = body?.values as { x: number; y: number }[] | undefined;
  if (!values?.length) throw new Error(`empty response for ${chart.name}`);

  // some charts return multiple points per day — keep the last per date
  const byDate = new Map<string, number>();
  for (const v of values) byDate.set(toUtcDate(v.x * 1000), Number(v.y));

  const cutoff = lastClosedUtcDate(); // exclude today's (UTC) partial day
  let rows = [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((r) => r.date <= cutoff && Number.isFinite(r.value));

  // drop zero/negative placeholder values at the start of the series
  const first = rows.findIndex((r) => r.value > 0);
  if (first === -1) throw new Error(`no positive values for ${chart.name}`);
  rows = rows.slice(first);

  write(`onchain-bc/${chart.name}.json`, {
    updatedAt: new Date().toISOString(),
    unit: chart.unit,
    rows,
  });
  console.log(
    `${chart.name}: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date}), latest ${rows.at(-1)!.value}`,
  );
}

async function main() {
  // sequential (politeness) but allSettled semantics: one bad chart must not
  // sink the run — stale files just stay in place
  const results: PromiseSettledResult<void>[] = [];
  for (const [i, chart] of CHARTS.entries()) {
    if (i > 0) await sleep(400);
    results.push(...(await Promise.allSettled([fetchChart(chart)])));
    const last = results.at(-1)!;
    if (last.status === "rejected") {
      const reason = (last as PromiseRejectedResult).reason;
      if (chart.optional) console.warn(`${chart.name}: skipped (${reason?.message ?? reason})`);
      else console.error(`${chart.name}: fetch failed:`, reason);
    }
  }
  // total failure should fail the job
  if (results.every((r) => r.status === "rejected")) process.exit(1);
}

main();
