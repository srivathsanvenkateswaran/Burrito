/**
 * App-side view of the asset registry. The registry itself
 * (scripts/lib/assets.ts) is the single source of truth; this module
 * re-exports it for the Next.js app and adds the derived helpers the UI
 * needs (chart-suite membership, sector grouping, chart-prose adapters).
 *
 * Kept free of Node built-ins (no `fs`, no imports from `./data`) so it can
 * be imported from client components (Header, Sidebar, SearchPalette) as
 * well as server ones.
 */
import {
  ASSETS,
  byId,
  FULL_SUITE,
  type AssetClass,
  type AssetDef,
  type FallbackSource,
  type PriceSource,
  type Suite,
} from "../../scripts/lib/assets";
import { chartsForAsset } from "./chartText";

export type { AssetClass, AssetDef, FallbackSource, PriceSource, Suite };

/** Every asset the registry knows about. */
export const ALL_ASSETS: AssetDef[] = ASSETS;

/** Look up an asset by id (lowercase); undefined if unknown. */
export function getAsset(id: string): AssetDef | undefined {
  return byId(id);
}

/** ids of the full-chart-suite assets, in registry order (BTC first). */
export const FULL_SUITE_IDS: string[] = FULL_SUITE.map((a) => a.id);

/**
 * The assets that get their own `/assets/[id]` dashboard: the full chart
 * suite plus USDT (supply-only). BTC leads, matching FULL_SUITE's order.
 */
export const PAGE_ASSETS: AssetDef[] = [...FULL_SUITE, ...ALL_ASSETS.filter((a) => a.id === "usdt")];

/**
 * The asset-scoped chart slugs that make up `id`'s suite, in registry
 * order. `["stablecoin-supply"]` for a supply-only asset (USDT); empty for
 * a suite:"full" asset whose fitted chart suite hasn't been computed yet
 * (e.g. a very recent IPO — spcx has only 64 rows against compute.ts's
 * 200-row floor).
 *
 * This module can't call `hasMetrics` itself (no `fs` — it's imported by
 * client components), so callers that know pass `hasSuite` explicitly:
 * server pages check `hasMetrics(id)` directly; client components get it
 * from a server-computed prop plumbed down from the layout. Defaults to
 * `true` for callers that already know the suite exists.
 */
export function assetChartSlugs(id: string, hasSuite = true): string[] {
  const asset = getAsset(id);
  if (!asset) return [];
  if (asset.suite === "supply") return ["stablecoin-supply"];
  if (asset.suite !== "full" || !hasSuite) return [];
  return chartsForAsset(asset.class, { hasHalvings: !!asset.halvings?.length }).map((c) => c.slug);
}

export interface ChartAsset {
  id: string;
  symbol: string;
  name: string;
  class: AssetClass;
  benchmark?: string;
  periodsPerYear: 365 | 252;
  quote: "USD" | "USDT" | "KRW";
}

/** The subset of an AssetDef that chart-prose interpolation (`chartText`) needs. */
export function toChartAsset(def: AssetDef): ChartAsset {
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

const SECTOR_ORDER = [
  "Indices",
  "Layer 1",
  "Big Tech",
  "EV & Space",
  "Semiconductors",
  "AI infrastructure & power",
  "Software & data",
  "Stablecoins",
];

export interface AssetGroup<T> {
  sector: string;
  class: AssetClass;
  items: T[];
}

/**
 * Group items (assets, or an asset-shaped compact list) by sector, in the
 * fixed class → sector order used everywhere in the UI: Indices, Layer 1,
 * Big Tech, EV & Space, Semiconductors, AI infrastructure & power,
 * Software & data, Stablecoins. Defaults to `PAGE_ASSETS`.
 */
export function groupAssets<T extends { sector: string; class: AssetClass } = AssetDef>(
  items: T[] = PAGE_ASSETS as unknown as T[],
): AssetGroup<T>[] {
  const bySector = new Map<string, T[]>();
  for (const item of items) {
    const list = bySector.get(item.sector);
    if (list) list.push(item);
    else bySector.set(item.sector, [item]);
  }
  return SECTOR_ORDER.flatMap((sector) => {
    const list = bySector.get(sector);
    if (!list || list.length === 0) return [];
    return [{ sector, class: list[0].class, items: list }];
  });
}
