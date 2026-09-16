import { notFound } from "next/navigation";
import { CHARTS, chartBySlug } from "@/lib/charts";
import { chartAppliesTo } from "@/lib/chartText";
import ChartPage from "@/components/chart-page/ChartPage";
import type { ChartPageAsset } from "@/components/chart-page/types";

const BTC: ChartPageAsset = {
  id: "btc",
  symbol: "BTC",
  name: "Bitcoin",
  class: "crypto",
  benchmark: "spx",
  periodsPerYear: 365,
  quote: "USD",
};

export function generateStaticParams() {
  // Same URL set as before the multi-asset extension: every chart except the
  // new asset-scoped ones that don't apply to BTC's class (e.g. stablecoin-supply).
  return CHARTS.filter((c) => c.scope !== "asset" || chartAppliesTo(c, BTC.class)).map((c) => ({
    slug: c.slug,
  }));
}

export default async function ChartRoutePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const def = chartBySlug(slug);
  if (!def) notFound();
  if (def.scope === "asset" && !chartAppliesTo(def, BTC.class)) notFound();

  return <ChartPage def={def} asset={BTC} />;
}
