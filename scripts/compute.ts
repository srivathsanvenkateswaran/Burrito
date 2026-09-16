/**
 * Derives the full metric suite for every `suite: "full"` asset in the
 * registry: data/raw/<id>/daily.json → data/metrics/<id>/*.json.
 * Rerun any time formulas change; raw data is never touched.
 *
 *   npx tsx scripts/compute.ts                 # every full-suite asset
 *   npx tsx scripts/compute.ts --only btc,eth  # a subset
 *   npx tsx scripts/compute.ts --refit         # ignore cached quantile-fan fits
 *
 * Without --refit each asset's quantile fan is refitted once per 28 days, on a
 * slot derived from its id (see `fanRefitDue`): a refit rewrites every fitted
 * number in that asset's files, so refitting all 32 at once adds ~15 MB
 * compressed to the repo against ~90 KB on an append-only day. Use --refit
 * after a formula change or a history backfill.
 *
 * Assets whose raw file is missing or has fewer than MIN_ROWS rows are
 * skipped with a warning, so a failed fetch never breaks the whole run.
 */
import { FULL_SUITE } from "./lib/assets";
import { computeAsset, type ComputeSummary } from "./lib/computeAsset";
import { readSeries } from "./lib/marketData";

const MIN_ROWS = 200;

function parseArgs(argv: string[]): { only: Set<string> | null; refit: boolean } {
  let only: Set<string> | null = null;
  let refit = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--refit") refit = true;
    else if (a === "--only") only = new Set((argv[++i] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
    else if (a.startsWith("--only=")) only = new Set(a.slice(7).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
    else throw new Error(`unknown argument ${a}`);
  }
  return { only, refit };
}

function main() {
  const { only, refit } = parseArgs(process.argv.slice(2));
  const targets = only ? FULL_SUITE.filter((a) => only.has(a.id)) : FULL_SUITE;
  if (only) {
    for (const id of only) if (!targets.some((a) => a.id === id)) console.warn(`[${id}] not a full-suite asset; skipped`);
  }
  const t0 = performance.now();
  const done: (ComputeSummary & { ms: number })[] = [];
  for (const def of targets) {
    const series = readSeries(def.id);
    if (!series) {
      console.warn(`[${def.id}] no raw series at data/raw/${def.id}/daily.json; skipped`);
      continue;
    }
    if (series.rows.length < MIN_ROWS) {
      console.warn(`[${def.id}] only ${series.rows.length} rows (< ${MIN_ROWS}); skipped`);
      continue;
    }
    const start = performance.now();
    try {
      const summary = computeAsset(def, series, { refit, log: true });
      const ms = performance.now() - start;
      done.push({ ...summary, ms });
      console.log(`[${def.id}] ${(ms / 1000).toFixed(1)}s${summary.fanRefit ? " (fan refit)" : ""}`);
    } catch (err) {
      console.error(`[${def.id}] failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const total = (performance.now() - t0) / 1000;
  console.log(`\n${done.length}/${targets.length} assets in ${total.toFixed(1)}s`);
  if (done.length > 1) {
    console.log(["id", "rows", "through", "risk", "mayer", "peaks", "bottoms", "s"].join("\t"));
    for (const d of done) {
      console.log([d.id, d.rows, d.through, d.risk, d.mayer, d.peaks.length, d.bottoms.length, (d.ms / 1000).toFixed(1)].join("\t"));
    }
  }
}

main();
