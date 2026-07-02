import { notFound } from "next/navigation";
import { CHARTS, chartBySlug } from "@/lib/charts";
import { loadMetrics, loadMonthlyReturns, metricPoints } from "@/lib/data";
import PriceChart from "@/components/PriceChart";
import MetricChart from "@/components/MetricChart";
import MonthlyHeatmap from "@/components/MonthlyHeatmap";
import ChartCard from "@/components/ChartCard";

export function generateStaticParams() {
  return CHARTS.map((c) => ({ slug: c.slug }));
}

function ChartBody({ slug }: { slug: string }) {
  const { rows } = loadMetrics();
  switch (slug) {
    case "price":
      return <PriceChart rows={rows} />;
    case "risk":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.risk)}
          colorByValue
          height={460}
          thresholds={[
            { value: 0.8, color: "rgba(239,68,68,0.6)", label: "take profit" },
            { value: 0.2, color: "rgba(34,197,94,0.6)", label: "accumulate" },
          ]}
        />
      );
    case "mayer":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.mayer, "2013-01-01")}
          color="#3b82f6"
          height={460}
          thresholds={[
            { value: 2.4, color: "rgba(239,68,68,0.6)", label: "hot" },
            { value: 0.8, color: "rgba(34,197,94,0.6)", label: "cheap" },
          ]}
        />
      );
    case "rsi":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.rsi14)}
          color="#a855f7"
          height={460}
          thresholds={[
            { value: 70, color: "rgba(239,68,68,0.6)", label: "overbought" },
            { value: 30, color: "rgba(34,197,94,0.6)", label: "oversold" },
          ]}
        />
      );
    case "running-roi":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.roi1y, "2013-01-01")}
          color="#10b981"
          height={460}
          thresholds={[{ value: 0, color: "rgba(139,139,150,0.5)", label: "breakeven" }]}
        />
      );
    case "monthly-returns":
      return (
        <ChartCard>
          <MonthlyHeatmap returns={loadMonthlyReturns()} />
        </ChartCard>
      );
    default:
      notFound();
  }
}

export default async function ChartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const def = chartBySlug(slug);
  if (!def) notFound();

  const metrics = loadMetrics();

  return (
    <main className="px-8 py-8">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-wider text-neutral-600">
          {def.category} · BTC
        </div>
        <h1 className="mt-1 text-xl font-bold tracking-tight">{def.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">{def.description}</p>
      </header>
      <ChartBody slug={slug} />
      <footer className="mt-6 text-xs text-neutral-600">
        data through {metrics.updatedThrough} · updates daily
      </footer>
    </main>
  );
}
