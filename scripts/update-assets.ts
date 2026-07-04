/**
 * Daily append job for every tradeable non-BTC asset (BTC has its own
 * update script). Fetches only the candles missing since each stored
 * series ends. Run: `npx tsx scripts/update-assets.ts`.
 */
import { TRADEABLE } from "./lib/assets";
import {
  fetchBinanceDaily,
  lastClosedUtcDate,
  mergeRows,
  readSeries,
  writeSeries,
} from "./lib/marketData";

const DELAY_MS = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const cutoff = lastClosedUtcDate();
  const assets = TRADEABLE.filter((a) => a.id !== "btc");

  for (const asset of assets) {
    const existing = readSeries(asset.id);
    if (!existing) {
      console.warn(`${asset.id}: no stored series — run backfill-assets first; skipping.`);
      continue;
    }

    const lastStored = existing.rows.at(-1)!.date;
    if (lastStored >= cutoff) {
      console.log(`${asset.id}: already current through ${lastStored}.`);
      continue;
    }

    try {
      const fresh = await fetchBinanceDaily(asset.binance!, lastStored);
      const rows = mergeRows(existing.rows, fresh).filter((r) => r.date <= cutoff);
      writeSeries({ ...existing, updatedAt: new Date().toISOString(), rows });
      console.log(
        `${asset.id}: appended ${rows.length - existing.rows.length} row(s); now through ${rows.at(-1)!.date}.`,
      );
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
