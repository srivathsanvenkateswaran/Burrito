import Link from "next/link";
import { notFound } from "next/navigation";
import { assetChartSlugs, FULL_SUITE_IDS, getAsset, toChartAsset, type AssetDef } from "@/lib/assets";
import { chartBySlug } from "@/lib/charts";
import { chartText } from "@/lib/chartText";
import { hasMetrics, loadAssetDaily, loadMetrics, loadSupply } from "@/lib/data";
import { fmtPct, fmtPrice } from "@/lib/format";
import { Stat, riskTone } from "@/components/StatTile";
import PriceChart from "@/components/PriceChart";
import MultiSeriesChart from "@/components/MultiSeriesChart";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...FULL_SUITE_IDS, "usdt"].map((asset) => ({ asset }));
}

function classLabel(cls: string): string {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function Chips({ def }: { def: AssetDef }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
      <span className="rounded-full border border-line px-2.5 py-0.5">{classLabel(def.class)}</span>
      <span className="rounded-full border border-line px-2.5 py-0.5">{def.sector}</span>
    </div>
  );
}

function Heading({ def }: { def: AssetDef }) {
  return (
    <header className="mb-6">
      <Chips def={def} />
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
        {def.name} <span className="text-muted">{def.symbol}</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{def.about}</p>
    </header>
  );
}

function ChartGrid({ id, def }: { id: string; def: AssetDef }) {
  const slugs = assetChartSlugs(id, hasMetrics(id));
  const chartAsset = toChartAsset(def);
  if (slugs.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {slugs.map((slug) => {
        const def2 = chartBySlug(slug);
        if (!def2) return null;
        const text = chartText(def2, chartAsset);
        return (
          <Link
            key={slug}
            href={`/assets/${id}/${slug}`}
            className="rounded-lg border border-line bg-surface/50 p-4 transition-colors hover:border-faint/60 hover:bg-raise"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">{def2.category}</div>
            <div className="mt-1 text-sm font-medium text-fg">{text.title}</div>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{text.description}</p>
          </Link>
        );
      })}
    </div>
  );
}

export default async function AssetPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset: id } = await params;
  const def = getAsset(id);
  if (!def || (def.suite !== "full" && def.suite !== "supply")) notFound();

  // --- USDT: supply-only asset, no price/risk suite ---------------------
  if (def.suite === "supply") {
    const { rows, updatedThrough } = loadSupply(id);
    const last = rows.at(-1);
    return (
      <main className="px-4 py-6 sm:px-8 sm:py-8">
        <Heading def={def} />
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Supply" value={last ? `$${(last.supply / 1e9).toFixed(2)}B` : "—"} sub="circulating" />
          <Stat
            label="30d change"
            value={last?.chg30d == null ? "—" : fmtPct(last.chg30d)}
            tone={last?.chg30d == null ? undefined : last.chg30d >= 0 ? "text-gain" : "text-loss"}
          />
          <Stat
            label="90d change"
            value={last?.chg90d == null ? "—" : fmtPct(last.chg90d)}
            tone={last?.chg90d == null ? undefined : last.chg90d >= 0 ? "text-gain" : "text-loss"}
          />
          <Stat label="All-time high" value={last ? `$${(last.ath / 1e9).toFixed(2)}B` : "—"} />
        </div>
        <Link
          href={`/assets/${id}/stablecoin-supply`}
          className="inline-block rounded-lg border border-line bg-surface/50 px-4 py-3 text-sm text-fg transition-colors hover:border-faint/60 hover:bg-raise"
        >
          View the full supply chart →
        </Link>
        <footer className="mt-8 text-xs text-faint">data through {updatedThrough} · updates daily</footer>
      </main>
    );
  }

  // --- Full-suite asset without a computed suite yet (e.g. spcx: too young) ---
  if (!hasMetrics(id)) {
    const { rows } = loadAssetDaily(id);
    return (
      <main className="px-4 py-6 sm:px-8 sm:py-8">
        <Heading def={def} />
        <MultiSeriesChart
          series={[
            {
              label: `${def.symbol} close`,
              color: "#e6a144",
              points: rows.map((r) => ({ date: r.date, value: r.close })),
            },
          ]}
        />
        <p className="mt-4 max-w-2xl text-xs text-faint">
          {def.name}&apos;s listing is too recent for the fitted risk and cycle suite — those charts need
          roughly a year of history before the fit means anything. This is the raw close price so far.
        </p>
      </main>
    );
  }

  // --- Normal full-suite asset -------------------------------------------
  const { rows, updatedThrough } = loadMetrics(id);
  const last = rows.at(-1)!;

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <Heading def={def} />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Risk"
          value={last.risk === null ? "—" : last.risk.toFixed(3)}
          tone={last.risk === null ? undefined : riskTone(last.risk)}
          sub="0 = cheap · 1 = euphoric"
        />
        <Stat
          label="Fair value"
          value={last.fair === null ? "—" : fmtPrice(last.fair, def.quote)}
          sub="fan median (τ 0.5)"
        />
        <Stat label="Mayer Multiple" value={last.mayer === null ? "—" : last.mayer.toFixed(2)} sub="price / 200d SMA" />
        <Stat label="RSI (14d)" value={last.rsi14 === null ? "—" : last.rsi14.toFixed(0)} sub="Wilder" />
        <Stat
          label="1y ROI"
          value={last.roi1y === null ? "—" : fmtPct(last.roi1y)}
          tone={last.roi1y === null ? undefined : last.roi1y >= 0 ? "text-gain" : "text-loss"}
        />
      </div>

      <section className="mb-10">
        <PriceChart rows={rows} />
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          {def.symbol}&apos;s charts
        </h2>
        <ChartGrid id={id} def={def} />
      </section>

      <footer className="mt-8 text-xs text-faint">data through {updatedThrough} · updates daily</footer>
    </main>
  );
}
