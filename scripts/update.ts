/**
 * Daily append job — run by GitHub Actions cron (or manually).
 * Fetches only the candles missing since the stored series ends,
 * preferring Binance with CryptoCompare as fallback.
 */
import {
  fetchBinanceDaily,
  fetchBlockchainInfoDaily,
  lastClosedUtcDate,
  mergeRows,
  readSeries,
  writeSeries,
  type DailyRow,
} from "./lib/marketData";

async function main() {
  const existing = readSeries("BTC");
  if (!existing) throw new Error("No stored series — run `npm run data:backfill` first.");

  const lastStored = existing.rows.at(-1)!.date;
  const cutoff = lastClosedUtcDate();
  if (lastStored >= cutoff) {
    console.log(`BTC already current through ${lastStored}; nothing to do.`);
    return;
  }

  console.log(`BTC stored through ${lastStored}; fetching missing day(s) through ${cutoff}…`);

  let fresh: DailyRow[];
  try {
    fresh = await fetchBinanceDaily("BTCUSDT", lastStored);
  } catch (err) {
    console.warn(`Binance unavailable (${err}); using blockchain.info.`);
    const all = await fetchBlockchainInfoDaily();
    fresh = all.filter((r) => r.date > lastStored);
  }

  const rows = mergeRows(existing.rows, fresh).filter((r) => r.date <= cutoff);
  writeSeries({ ...existing, updatedAt: new Date().toISOString(), rows });
  console.log(`Appended ${rows.length - existing.rows.length} row(s); now through ${rows.at(-1)!.date}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
