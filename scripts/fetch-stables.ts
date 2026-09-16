/**
 * USDT circulating supply from DefiLlama → data/raw/stables/usdt.json
 * ({updatedAt, rows: [{date, supply}]}, one row per line). Uses the
 * `stablecoincharts/all?stablecoin=1` endpoint (~465 KB) rather than
 * `stablecoin/1` (21 MB with per-chain detail). Daily since 2017-11-29,
 * no key. Rows dated after the last closed UTC day are dropped so the
 * stored values are final. Run: `npm run data:stables`.
 */
import fs from "node:fs";
import path from "node:path";
import { lastClosedUtcDate, toUtcDate } from "./lib/marketData";

const URL = "https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=1";
const OUT = path.join(process.cwd(), "data", "raw", "stables", "usdt.json");

interface SupplyRow {
  date: string;
  supply: number;
}

async function main() {
  const res = await fetch(URL, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`DefiLlama ${res.status} ${res.statusText}`);
  const body = (await res.json()) as { date: string; totalCirculating?: { peggedUSD?: number } }[];
  if (!Array.isArray(body)) throw new Error("DefiLlama: unexpected payload");

  const cutoff = lastClosedUtcDate();
  const byDate = new Map<string, number>();
  for (const p of body) {
    const supply = p.totalCirculating?.peggedUSD;
    if (supply == null || !Number.isFinite(supply) || supply <= 0) continue;
    const date = toUtcDate(Number(p.date) * 1000);
    if (date > cutoff) continue;
    byDate.set(date, supply);
  }
  const rows: SupplyRow[] = [...byDate.entries()]
    .map(([date, supply]) => ({ date, supply }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) throw new Error("DefiLlama: no rows parsed");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const head = JSON.stringify({ updatedAt: new Date().toISOString() }, null, 2).slice(0, -2);
  const lines = rows.map((r) => `    ${JSON.stringify(r)}`).join(",\n");
  fs.writeFileSync(OUT, `${head},\n  "rows": [\n${lines}\n  ]\n}\n`);
  console.log(
    `usdt supply: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date}, latest ${(rows.at(-1)!.supply / 1e9).toFixed(2)}B)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
