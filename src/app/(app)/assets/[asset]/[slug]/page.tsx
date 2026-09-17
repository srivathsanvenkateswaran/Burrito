import { notFound } from "next/navigation";
import { ASSETS, byId, FULL_SUITE, type AssetDef } from "../../../../../../scripts/lib/assets";
import { chartBySlug } from "@/lib/charts";
import { chartAppliesTo, chartsForAsset } from "@/lib/chartText";
import { hasMetrics } from "@/lib/data";
import ChartPage from "@/components/chart-page/ChartPage";
import type { ChartPageAsset } from "@/components/chart-page/types";

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

const STATIC_ASSETS = FULL_SUITE.filter((a) => hasMetrics(a.id));
const USDT = ASSETS.find((a) => a.id === "usdt");

export function generateStaticParams() {
  const params: { asset: string; slug: string }[] = [];
  for (const a of STATIC_ASSETS) {
    for (const def of chartsForAsset(a.class, { hasHalvings: !!a.halvings })) {
      params.push({ asset: a.id, slug: def.slug });
    }
  }
  if (USDT) params.push({ asset: USDT.id, slug: "stablecoin-supply" });
  return params;
}

export const dynamicParams = false;

export default async function AssetChartPage({
  params,
}: {
  params: Promise<{ asset: string; slug: string }>;
}) {
  const { asset: assetId, slug } = await params;
  const def = chartBySlug(slug);
  if (!def) notFound();

  const assetDef = byId(assetId);
  if (!assetDef) notFound();

  const isUsdtSupply = assetDef.id === "usdt" && slug === "stablecoin-supply";
  if (assetDef.suite !== "full" && !isUsdtSupply) notFound();
  if (!chartAppliesTo(def, assetDef.class)) notFound();
  if (def.slug === "roi-after-halving" && !assetDef.halvings) notFound();

  return <ChartPage def={def} asset={toChartAsset(assetDef)} />;
}
