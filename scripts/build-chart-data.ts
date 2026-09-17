/**
 * Writes one static JSON file per chart page into public/chart-data/, so the
 * pages themselves ship only their prose and fetch their series in the browser.
 *
 *   public/chart-data/<assetId>/<slug>.json   one chart page's blocks
 *   public/chart-data/<assetId>/_price.json   the PriceChart on /dashboard and /assets/<id>
 *
 * The route set mirrors the app's `generateStaticParams` exactly: every CHART
 * that /charts/<slug> renders for BTC, every /assets/<id>/<slug> of the full
 * suite, plus USDT's supply chart.
 */
import fs from "node:fs";
import path from "node:path";
import { ASSETS, FULL_SUITE, type AssetDef } from "./lib/assets";
import { CHARTS } from "../src/lib/charts";
import { chartAppliesTo, chartsForAsset } from "../src/lib/chartText";
import { hasMetrics } from "../src/lib/data";
import { chartSpec, priceSpec, type ChartSpec } from "../src/lib/chartSpec";
import type { ChartPageAsset } from "../src/components/chart-page/types";

const outRoot = path.join(process.cwd(), "public", "chart-data");

function toChartAsset(def: AssetDef): ChartPageAsset {
  return {
    id: def.id,
    symbol: def.symbol,
    name: def.name,
    class: def.class,
    benchmark: def.benchmark,
    periodsPerYear: def.periodsPerYear,
    quote: def.quote,
  };
}

/**
 * Six significant digits is well past a chart pixel's worth of precision and
 * cuts the payload roughly in half. Integers (counts, day offsets, supply) are
 * left exact — `toPrecision(6)` would round 1,234,567 to 1,234,570.
 */
function round(_key: string, value: unknown): unknown {
  if (typeof value === "number" && Number.isFinite(value) && !Number.isInteger(value)) {
    return Number(value.toPrecision(6));
  }
  return value;
}

let files = 0;
let bytes = 0;
let largest = { file: "", bytes: 0 };

function write(assetId: string, name: string, spec: ChartSpec): void {
  const dir = path.join(outRoot, assetId);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  const json = JSON.stringify(spec, round);
  fs.writeFileSync(file, json);
  const size = Buffer.byteLength(json);
  files++;
  bytes += size;
  if (size > largest.bytes) largest = { file: `${assetId}/${name}.json`, bytes: size };
}

const start = Date.now();
fs.rmSync(outRoot, { recursive: true, force: true });

const missing: string[] = [];
const written = new Set<string>();

function emit(asset: ChartPageAsset, slug: string): void {
  const key = `${asset.id}/${slug}`;
  if (written.has(key)) return;
  const spec = chartSpec(slug, asset);
  if (!spec) {
    missing.push(key);
    return;
  }
  written.add(key);
  write(asset.id, slug, spec);
}

// --- /charts/<slug> (Bitcoin) -------------------------------------------
const btcDef = ASSETS.find((a) => a.id === "btc");
if (!btcDef) throw new Error("btc is missing from the asset registry");
const btc = toChartAsset(btcDef);
for (const def of CHARTS) {
  if (def.scope === "asset" && !chartAppliesTo(def, btc.class)) continue;
  emit(btc, def.slug);
}

// --- /assets/<id>/<slug> ------------------------------------------------
for (const a of FULL_SUITE) {
  if (!hasMetrics(a.id)) continue;
  const asset = toChartAsset(a);
  for (const def of chartsForAsset(a.class, { hasHalvings: !!a.halvings })) {
    emit(asset, def.slug);
  }
}

const usdt = ASSETS.find((a) => a.id === "usdt");
if (usdt) emit(toChartAsset(usdt), "stablecoin-supply");

// --- the price chart on /dashboard and /assets/<id> ---------------------
for (const a of FULL_SUITE) {
  write(a.id, "_price", priceSpec(a.id, a.symbol));
}

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;
console.log(
  `chart-data: ${files} files, ${mb(bytes)} total, largest ${largest.file} ${(largest.bytes / 1024).toFixed(0)} KB, ${((Date.now() - start) / 1000).toFixed(1)}s`,
);
if (missing.length) {
  console.error(`chart-data: no spec for ${missing.length} route(s): ${missing.join(", ")}`);
  process.exit(1);
}
