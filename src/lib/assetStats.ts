/**
 * Server-only helper that assembles one asset's display stats (price, 24h
 * change, risk, Mayer) defensively: prefer assets-summary.json, fall back to
 * the per-asset metrics file, fall back further to raw daily prices for a
 * full-suite asset whose suite hasn't been computed yet (spcx). Uses `fs`
 * via src/lib/data.ts, so import this only from server components.
 */
import { FULL_SUITE_IDS, getAsset, type AssetClass, type AssetDef } from "./assets";
import { hasMetrics, loadAssetDaily, loadAssetsSummary, loadMetrics, type AssetSummary } from "./data";

export interface AssetStat {
  id: string;
  def: AssetDef;
  class: AssetClass;
  sector: string;
  quote: string;
  close: number | null;
  chg24h: number | null;
  risk: number | null;
  mayer: number | null;
  rsi14: number | null;
  roi1y: number | null;
  fair: number | null;
  /** True when data/metrics/<id>/daily.json exists (the fitted suite has been computed). */
  metricsOk: boolean;
}

let summaryCache: Map<string, AssetSummary> | null = null;

function summaryById(): Map<string, AssetSummary> {
  if (!summaryCache) {
    summaryCache = new Map(loadAssetsSummary().assets.map((a) => [a.id, a]));
  }
  return summaryCache;
}

/**
 * ids of PAGE_ASSETS whose chart suite is computed and navigable:
 * FULL_SUITE ids with data/metrics/<id>/daily.json, plus USDT (supply-only,
 * always has its one chart). Passed down to client nav (Header, Sidebar,
 * SearchPalette) as the `hasSuite` flag `assetChartSlugs` needs, since
 * those components can't call `hasMetrics` themselves.
 */
export function computedSuiteIds(): string[] {
  return [...FULL_SUITE_IDS.filter(hasMetrics), "usdt"];
}

export function assetStat(id: string): AssetStat {
  const def = getAsset(id);
  if (!def) throw new Error(`assetStat: unknown asset "${id}"`);

  const s = summaryById().get(id);
  const metricsOk = hasMetrics(id);

  let close = s?.close ?? null;
  let chg24h = s?.chg24h ?? null;
  let risk = s?.risk ?? null;
  let mayer = s?.mayer ?? null;
  let rsi14: number | null = null;
  let roi1y = s?.roi1y ?? null;
  let fair = s?.fair ?? null;

  if (metricsOk) {
    const { rows } = loadMetrics(id);
    const last = rows.at(-1);
    const prev = rows.at(-2);
    if (last) {
      if (close === null) close = last.close;
      if (chg24h === null && prev) chg24h = ((last.close - prev.close) / prev.close) * 100;
      if (risk === null) risk = last.risk;
      if (mayer === null) mayer = last.mayer;
      rsi14 = last.rsi14;
      if (roi1y === null) roi1y = last.roi1y;
      if (fair === null) fair = last.fair;
    }
  } else if (def.price.kind !== "none" && close === null) {
    try {
      const { rows } = loadAssetDaily(id);
      const last = rows.at(-1);
      const prev = rows.at(-2);
      if (last) {
        close = last.close;
        if (prev) chg24h = ((last.close - prev.close) / prev.close) * 100;
      }
    } catch {
      // no raw file either (shouldn't happen for a tradeable asset) — leave null
    }
  }

  return {
    id,
    def,
    class: s?.class ?? def.class,
    sector: s?.sector ?? def.sector,
    quote: s?.quote ?? def.quote,
    close,
    chg24h,
    risk,
    mayer,
    rsi14,
    roi1y,
    fair,
    metricsOk,
  };
}
