import Header, { type HeaderAsset } from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { FULL_SUITE_IDS } from "@/lib/assets";
import { assetStat, computedSuiteIds } from "@/lib/assetStats";
import { loadMetrics } from "@/lib/data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const date = loadMetrics().rows.at(-1)!.date;

  const ids = [...FULL_SUITE_IDS, "usdt"];
  const suiteIds = computedSuiteIds();
  const assets: HeaderAsset[] = ids.map((id) => {
    const s = assetStat(id);
    return {
      id,
      symbol: s.def.symbol,
      name: s.def.name,
      class: s.class,
      sector: s.sector,
      close: s.close,
      chg24h: s.chg24h,
      risk: s.risk,
      quote: s.quote,
      hasSuite: suiteIds.includes(id),
    };
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar suiteIds={suiteIds} />
      <div className="min-w-0 flex-1">
        <Header assets={assets} date={date} />
        {children}
      </div>
    </div>
  );
}
