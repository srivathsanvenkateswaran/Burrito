/**
 * Market caps for tradeable assets the Coin Metrics community API doesn't
 * cover: take today's real market cap from CoinGecko (one keyless call),
 * derive implied supply = mcap / today's price, and estimate history as
 * supply × our stored daily closes. Ignores historical supply inflation —
 * fine for dominance/aggregate math, flagged in chart explanations.
 */
import fs from "node:fs";
import path from "node:path";
import { ASSETS } from "./lib/assets";
import { readSeries } from "./lib/marketData";

// registry id → CoinGecko id, only for assets needing estimation
const COINGECKO_IDS: Record<string, string> = {
  sol: "solana",
  trx: "tron",
  ton: "the-open-network",
  avax: "avalanche-2",
  atom: "cosmos",
  vet: "vechain",
  hbar: "hedera-hashgraph",
  sui: "sui",
  render: "render-token",
  near: "near",
  fil: "filecoin",
  bnb: "binancecoin",
  dot: "polkadot",
  xtz: "tezos",
};

async function main() {
  const targets = ASSETS.filter(
    (a) => a.binance !== null && a.coinmetrics === null && COINGECKO_IDS[a.id],
  );
  const ids = targets.map((a) => COINGECKO_IDS[a.id]).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const now = (await res.json()) as Record<string, { usd: number; usd_market_cap: number }>;

  for (const asset of targets) {
    const cg = now[COINGECKO_IDS[asset.id]];
    if (!cg?.usd_market_cap) {
      console.warn(`${asset.id}: no CoinGecko data — skipped`);
      continue;
    }
    const series = readSeries(asset.id);
    if (!series) {
      console.warn(`${asset.id}: no price series — skipped`);
      continue;
    }
    const impliedSupply = cg.usd_market_cap / cg.usd;
    const rows = series.rows.map((r) => ({
      date: r.date,
      mcap: Math.round(r.close * impliedSupply),
    }));
    const file = path.join(process.cwd(), "data", "raw", "mcap", `${asset.id}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      JSON.stringify({ updatedAt: new Date().toISOString(), estimated: true, rows }),
    );
    console.log(
      `${asset.id}: estimated ${rows.length} rows (supply ${(impliedSupply / 1e6).toFixed(1)}M, latest $${(rows.at(-1)!.mcap / 1e9).toFixed(1)}B)`,
    );
  }
}

main();
