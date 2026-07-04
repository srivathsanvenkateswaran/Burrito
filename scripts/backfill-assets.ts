/**
 * One-time full-history backfill for every tradeable non-BTC asset
 * (BTC has its own script with pre-Binance history). Binance returns
 * candles from listing regardless of how early startTime is, so a single
 * 2017 start date covers every pair. Only fully closed UTC candles are
 * stored. Run: `npx tsx scripts/backfill-assets.ts`.
 */
import { TRADEABLE } from "./lib/assets";
import {
  fetchBinanceDaily,
  lastClosedUtcDate,
  writeSeries,
} from "./lib/marketData";

const EARLIEST_START = "2017-01-01"; // predates every Binance listing
const DELAY_MS = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const cutoff = lastClosedUtcDate();
  const assets = TRADEABLE.filter((a) => a.id !== "btc");
  console.log(`Backfilling ${assets.length} assets through ${cutoff}…`);

  for (const asset of assets) {
    try {
      const fetched = await fetchBinanceDaily(asset.binance!, EARLIEST_START);
      const rows = fetched.filter((r) => r.date <= cutoff);
      if (rows.length === 0) {
        console.warn(`${asset.id}: no candles returned for ${asset.binance}; skipping.`);
        continue;
      }
      writeSeries({
        asset: asset.symbol,
        quote: "USDT",
        updatedAt: new Date().toISOString(),
        rows,
      });
      console.log(`${asset.id}: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date})`);
    } catch (err) {
      console.warn(`${asset.id}: fetch failed for ${asset.binance} (${err}); skipping.`);
    }
    await sleep(DELAY_MS);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
