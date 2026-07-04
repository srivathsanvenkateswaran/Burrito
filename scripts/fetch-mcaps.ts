/**
 * Daily market caps (CapMrktCurUSD) from the Coin Metrics Community API.
 * Full refetch every run (idempotent, cron-friendly): assets are batched
 * ~10 per request, pages followed sequentially with a polite delay to stay
 * under the community rate limit (~10 req / 6 s per IP).
 *
 * Output: data/raw/mcap/<registry id>.json
 *   { updatedAt, rows: [{ date, mcap }] }  ascending, whole USD,
 *   excluding today's (UTC) still-forming value.
 */
import fs from "node:fs";
import path from "node:path";
import { toUtcDate } from "./lib/marketData";
import { ASSETS } from "./lib/assets";

const API = "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics";
const BATCH_SIZE = 10;
const DELAY_MS = 700; // ~8.5 req / 6 s, under the ~10 req / 6 s community limit

interface McapRow {
  date: string; // YYYY-MM-DD (UTC)
  mcap: number; // USD, whole dollars
}

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

function write(id: string, rows: McapRow[]) {
  const file = path.join(process.cwd(), "data", "raw", "mcap", `${id}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ updatedAt: new Date().toISOString(), rows }));
}

/** Fetch full daily CapMrktCurUSD history for one batch of coinmetrics ids. */
async function fetchBatch(cmIds: string[]): Promise<Map<string, McapRow[]>> {
  const byAsset = new Map<string, McapRow[]>(cmIds.map((id) => [id, []]));
  const today = toUtcDate(Date.now());
  let url: string | undefined =
    `${API}?assets=${cmIds.join(",")}&metrics=CapMrktCurUSD&frequency=1d` +
    `&page_size=10000&paging_from=start`;
  while (url) {
    const body = await getJson(url);
    for (const r of body.data as any[]) {
      if (r.CapMrktCurUSD == null) continue;
      const date = (r.time as string).slice(0, 10);
      if (date >= today) continue; // skip today's partial value
      byAsset.get(r.asset)?.push({ date, mcap: Math.round(Number(r.CapMrktCurUSD)) });
    }
    url = body.next_page_url;
    if (url) await sleep(DELAY_MS);
  }
  return byAsset;
}

async function main() {
  const covered = ASSETS.filter((a) => a.coinmetrics !== null);
  let failures = 0;
  for (let i = 0; i < covered.length; i += BATCH_SIZE) {
    const batch = covered.slice(i, i + BATCH_SIZE);
    try {
      const byAsset = await fetchBatch(batch.map((a) => a.coinmetrics!));
      for (const a of batch) {
        const rows = (byAsset.get(a.coinmetrics!) ?? []).sort((x, y) =>
          x.date.localeCompare(y.date),
        );
        if (rows.length === 0) {
          console.warn(`${a.id}: no rows returned (coinmetrics id '${a.coinmetrics}')`);
          continue;
        }
        write(a.id, rows);
        console.log(`${a.id}: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date})`);
      }
    } catch (err) {
      failures++;
      console.error(`batch [${batch.map((a) => a.id).join(",")}] failed:`, err);
    }
    if (i + BATCH_SIZE < covered.length) await sleep(DELAY_MS);
  }
  console.log(`done: ${requestCount} requests`);
  // partial failure is fine (stale files stay); total failure should fail the job
  if (failures > 0 && failures === Math.ceil(covered.length / BATCH_SIZE)) process.exit(1);
}

main();
