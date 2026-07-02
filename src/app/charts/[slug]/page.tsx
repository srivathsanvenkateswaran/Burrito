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
            { value: 0.8, color: "rgba(222,107,90,0.7)", label: "take profit" },
            { value: 0.2, color: "rgba(130,181,122,0.7)", label: "accumulate" },
          ]}
        />
      );
    case "mayer":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.mayer, "2013-01-01")}
          color="#8ba7c9"
          height={460}
          thresholds={[
            { value: 2.4, color: "rgba(222,107,90,0.7)", label: "hot" },
            { value: 0.8, color: "rgba(130,181,122,0.7)", label: "cheap" },
          ]}
        />
      );
    case "rsi":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.rsi14)}
          color="#b391bf"
          height={460}
          thresholds={[
            { value: 70, color: "rgba(222,107,90,0.7)", label: "overbought" },
            { value: 30, color: "rgba(130,181,122,0.7)", label: "oversold" },
          ]}
        />
      );
    case "running-roi":
      return (
        <MetricChart
          points={metricPoints(rows, (r) => r.roi1y, "2013-01-01")}
          color="#82b57a"
          height={460}
          thresholds={[{ value: 0, color: "rgba(162,147,130,0.5)", label: "breakeven" }]}
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
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          {def.category} · BTC
        </div>
        <h1 className="mt-1 font-display text-3xl italic tracking-wide">{def.title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">{def.description}</p>
      </header>
      <ChartBody slug={slug} />
      <footer className="mt-6 text-xs text-faint">
        data through {metrics.updatedThrough} · updates daily
      </footer>
    </main>
  );
}
