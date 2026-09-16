import { CHARTS, type ChartDef } from "./charts";

/** Mirrors `AssetClass` in scripts/lib/assets.ts; kept here so the app never imports from scripts/. */
export type AssetClass = "crypto" | "stablecoin" | "equity" | "index";

/** The subset of an asset definition the chart prose needs. */
export interface ChartAsset {
  id: string;
  symbol: string;
  name: string;
  class: AssetClass;
}

/** What `/charts/<slug>` renders when no asset is given: the original Bitcoin text. */
export const DEFAULT_CHART_ASSET: ChartAsset = {
  id: "btc",
  symbol: "BTC",
  name: "Bitcoin",
  class: "crypto",
};

/** Classes an asset-scoped chart applies to when it does not restrict itself with `classes`. */
export const DEFAULT_CHART_CLASSES: AssetClass[] = ["crypto", "equity", "index"];

export interface ChartTextResult {
  title: string;
  description: string;
  explanation: string[];
}

/** Replace `{name}` / `{symbol}` tokens. Unknown tokens are left untouched. */
export function interpolate(text: string, asset: ChartAsset): string {
  return text.replace(/\{(name|symbol)\}/g, (_, key: "name" | "symbol") =>
    key === "name" ? asset.name : asset.symbol,
  );
}

/**
 * Resolve a chart's prose for a given asset: interpolate tokens and swap in the
 * class-specific explanation when the chart defines one. With no asset the
 * result is the Bitcoin text, so existing `/charts/<slug>` pages are unchanged.
 */
export function chartText(def: ChartDef, asset: ChartAsset = DEFAULT_CHART_ASSET): ChartTextResult {
  const paras = def.explanationByClass?.[asset.class] ?? def.explanation;
  return {
    title: interpolate(def.title, asset),
    description: interpolate(def.description, asset),
    explanation: paras.map((p) => interpolate(p, asset)),
  };
}

/** True when an asset-scoped chart is meant to render for assets of this class. */
export function chartAppliesTo(def: ChartDef, cls: AssetClass): boolean {
  if (def.scope !== "asset") return false;
  return (def.classes ?? DEFAULT_CHART_CLASSES).includes(cls);
}

/**
 * The asset-scoped charts that make up an asset's suite, in registry order.
 * `roi-after-halving` is included only when the asset has halving dates.
 */
export function chartsForAsset(cls: AssetClass, opts: { hasHalvings?: boolean } = {}): ChartDef[] {
  return CHARTS.filter((def) => {
    if (!chartAppliesTo(def, cls)) return false;
    if (def.slug === "roi-after-halving" && !opts.hasHalvings) return false;
    return true;
  });
}
