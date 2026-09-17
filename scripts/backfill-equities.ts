/**
 * Full-history backfill for every equity and index in the registry (assets
 * whose price source is Yahoo or Naver). Yahoo returns the whole listing
 * history but rate-limits by IP; when it fails the asset's fallback (Nasdaq
 * .com 10-year window, Cboe for SPX) is used instead. Idempotent: fetched
 * rows are merged over the existing file (fetched wins), so re-running from
 * a machine where Yahoo answers extends the history without touching
 * overlapping dates. Run: `npm run data:backfill-equities [-- --only aapl,spx]`.
 */
import { TRADEABLE } from "./lib/assets";
import { cleanRows, fetchAssetDaily, isExchangeAsset, resolveMergeSeam } from "./lib/equityData";
import { mergeRows, readSeries, writeSeries, type DailyRow } from "./lib/marketData";

const DELAY_MS = 400;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function parseOnly(argv: string[]): Set<string> | null {
  const i = argv.indexOf("--only");
  if (i === -1 || !argv[i + 1]) return null;
  return new Set(argv[i + 1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
}

function sameRows(a: DailyRow[], b: DailyRow[]): boolean {
  return a.length === b.length && a.every((r, i) => JSON.stringify(r) === JSON.stringify(b[i]));
}

/**
 * Merge fetched rows over the stored ones, reporting the case where the two
 * are on opposite sides of a split. `update-equities` guards its merge with
 * `detectSplit`; without the same guard here, a backfill run on a day Yahoo
 * 429s pastes Nasdaq's post-split 10-year window over pre-split Yahoo history
 * and leaves a step discontinuity at the 10-year boundary.
 */
function mergeSeam(id: string, existing: DailyRow[], fetched: DailyRow[], source: string): DailyRow[] {
  const { seam, keep } = resolveMergeSeam(existing, fetched);
  if (seam) {
    const kept = keep === "fetched" ? fetched : existing;
    console.warn(
      `${id}: fetched (${source}) and stored closes differ >5% on ${seam} (split, or a source that ` +
        `adjusts differently) — not merging. Keeping the ${keep === "fetched" ? source : "stored"} ` +
        `series whole (${kept.length} rows from ${kept[0].date}).`,
    );
  }
  if (keep === "fetched") return fetched;
  if (keep === "existing") return existing;
  return mergeRows(existing, fetched);
}

async function main() {
  const only = parseOnly(process.argv.slice(2));
  const assets = TRADEABLE.filter(isExchangeAsset).filter((a) => !only || only.has(a.id));
  console.log(`Backfilling ${assets.length} exchange-listed assets…`);

  const failures: string[] = [];
  for (const asset of assets) {
    try {
      const { rows: fetched, source } = await fetchAssetDaily(asset, { mode: "backfill" });
      const existing = readSeries(asset.id);
      const rows = cleanRows(mergeSeam(asset.id, existing?.rows ?? [], fetched, source), asset);
      if (existing && sameRows(existing.rows, rows)) {
        console.log(`${asset.id}: unchanged (${rows.length} rows via ${source}).`);
      } else {
        writeSeries(
          { asset: asset.symbol, quote: asset.quote, updatedAt: new Date().toISOString(), rows },
          asset.id,
        );
        console.log(
          `${asset.id}: ${rows.length} rows via ${source} (${rows[0].date} → ${rows.at(-1)!.date}, last close ${rows.at(-1)!.close})`,
        );
      }
    } catch (err) {
      failures.push(asset.id);
      console.warn(`${asset.id}: ${err instanceof Error ? err.message : err}; keeping existing file.`);
    }
    await sleep(DELAY_MS);
  }
  if (failures.length) console.warn(`Failed: ${failures.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
