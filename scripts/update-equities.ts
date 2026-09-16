/**
 * Daily append job for every equity and index (assets whose price source is
 * Yahoo or Naver). Fetches the last ~10 days per asset, merges them into
 * the stored series (idempotent by date, fetched wins) and only writes when
 * rows actually changed. If a fetched bar disagrees with the stored close
 * for the same date by more than 5 % a split has happened: the whole
 * history is refetched and replaces the file.
 * Run: `npm run data:equities`.
 */
import { TRADEABLE } from "./lib/assets";
import {
  cleanRows,
  detectSplit,
  fetchAssetDaily,
  isExchangeAsset,
  refetchIsComplete,
} from "./lib/equityData";
import {
  lastClosedUtcDate,
  mergeRows,
  readSeries,
  writeSeries,
  type DailyRow,
} from "./lib/marketData";

const DELAY_MS = 400;
const WINDOW_DAYS = 10;
/** A split refetch must return at least this share of the stored row count to be trusted. */
const MIN_REFETCH_COVERAGE = 0.9;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sameRows(a: DailyRow[], b: DailyRow[]): boolean {
  return a.length === b.length && a.every((r, i) => JSON.stringify(r) === JSON.stringify(b[i]));
}

async function main() {
  const cutoff = lastClosedUtcDate();
  const assets = TRADEABLE.filter(isExchangeAsset);
  const failures: string[] = [];

  for (const asset of assets) {
    const existing = readSeries(asset.id);
    if (!existing || existing.rows.length === 0) {
      console.warn(`${asset.id}: no stored series — run data:backfill-equities first; skipping.`);
      continue;
    }
    const lastStored = existing.rows.at(-1)!.date;
    if (lastStored >= cutoff) {
      console.log(`${asset.id}: already current through ${lastStored}.`);
      continue;
    }

    try {
      const since = new Date(Date.parse(`${lastStored}T00:00:00Z`) - WINDOW_DAYS * 86_400_000)
        .toISOString()
        .slice(0, 10);
      let { rows: fetched, source } = await fetchAssetDaily(asset, { mode: "update", since });

      const splitDate = detectSplit(existing.rows, fetched);
      let rows: DailyRow[];
      if (splitDate) {
        console.warn(`${asset.id}: stored close differs >5% on ${splitDate} (split?) — refetching full history.`);
        ({ rows: fetched, source } = await fetchAssetDaily(asset, { mode: "backfill" }));
        const refetched = cleanRows(fetched, asset, cutoff);
        // A split refetch replaces the file wholesale, so it has to actually
        // carry the history it replaces (see refetchIsComplete).
        if (!refetchIsComplete(existing.rows, refetched, MIN_REFETCH_COVERAGE)) {
          console.warn(
            `${asset.id}: SPLIT REFETCH REJECTED — ${source} returned ${refetched.length} rows from ` +
              `${refetched[0]?.date ?? "nothing"}, against ${existing.rows.length} stored rows from ` +
              `${existing.rows[0].date}. Keeping the existing file unchanged and skipping ${asset.id} ` +
              `for today; re-run once the full-history source answers.`,
          );
          failures.push(asset.id);
          continue;
        }
        rows = refetched;
      } else {
        rows = cleanRows(mergeRows(existing.rows, fetched), asset, cutoff);
      }

      if (sameRows(existing.rows, rows)) {
        console.log(`${asset.id}: no new bars (${source}); still through ${lastStored}.`);
        continue;
      }
      writeSeries(
        { asset: asset.symbol, quote: asset.quote, updatedAt: new Date().toISOString(), rows },
        asset.id,
      );
      console.log(
        `${asset.id}: ${splitDate ? "replaced" : `appended ${rows.length - existing.rows.length} row(s)`} via ${source}; now through ${rows.at(-1)!.date} (close ${rows.at(-1)!.close}).`,
      );
    } catch (err) {
      failures.push(asset.id);
      console.warn(`${asset.id}: ${err instanceof Error ? err.message : err}; keeping stale file.`);
    }
    await sleep(DELAY_MS);
  }
  if (failures.length) console.warn(`Failed: ${failures.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
