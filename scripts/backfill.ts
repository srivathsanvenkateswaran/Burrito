/**
 * One-time full-history backfill. Run per asset: `npm run data:backfill`.
 * blockchain.info covers 2010→today (close-only); Binance rows override
 * where they exist (full OHLCV, ~2017-08 onward for BTC). Only fully
 * closed UTC candles are stored.
 */
import {
  fetchBinanceDaily,
  fetchBlockchainInfoDaily,
  lastClosedUtcDate,
  mergeRows,
  writeSeries,
} from "./lib/marketData";

const BINANCE_BTC_LISTING = "2017-08-17";

async function main() {
  console.log("Backfilling BTC/USD daily history…");
  const early = await fetchBlockchainInfoDaily();
  console.log(`  blockchain.info: ${early.length} rows (${early[0].date} → ${early.at(-1)!.date})`);

  const binance = await fetchBinanceDaily("BTCUSDT", BINANCE_BTC_LISTING);
  console.log(`  Binance: ${binance.length} rows (${binance[0].date} → ${binance.at(-1)!.date})`);

  const cutoff = lastClosedUtcDate();
  const rows = mergeRows(early, binance).filter((r) => r.date <= cutoff);
  writeSeries({
    asset: "BTC",
    quote: "USD",
    updatedAt: new Date().toISOString(),
    rows,
  });
  console.log(`Wrote ${rows.length} rows through ${rows.at(-1)!.date} to data/raw/btc/daily.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
