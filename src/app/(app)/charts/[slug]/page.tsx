import { notFound } from "next/navigation";
import { CHARTS, chartBySlug } from "@/lib/charts";
import {
  loadDaysSince,
  loadDistributions,
  loadEventRoi,
  loadEvents,
  loadFan,
  loadMetrics,
  loadMonthlyReturns,
  loadRoiBands,
  loadTa,
  loadYtdRoi,
  metricPoints,
  taPoints,
} from "@/lib/data";
import { riskColor } from "@/lib/colors";
import DaysAxisChart from "@/components/DaysAxisChart";
import RiskColoredPrice from "@/components/RiskColoredPrice";
import YtdRoiChart from "@/components/YtdRoiChart";
import PriceChart from "@/components/PriceChart";
import MetricChart from "@/components/MetricChart";
import MultiSeriesChart from "@/components/MultiSeriesChart";
import CategoryBars from "@/components/CategoryBars";
import PeriodHeatmap from "@/components/PeriodHeatmap";
import MilestoneChart from "@/components/MilestoneChart";
import ChartCard from "@/components/ChartCard";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_PALETTE = [
  "#e6a144", "#8ba7c9", "#82b57a", "#de6b5a", "#b391bf", "#7fb5a8",
  "#c07a4a", "#a8a862", "#cf8fa8", "#ede3d4", "#909c6b", "#c9a06a",
];

function daysSinceBody(direction: "declines" | "gains") {
  const ds = loadDaysSince();
  const groups = ds[direction];
  const priceRows = loadMetrics().rows;
  const colors = ["#e6a144", "#8ba7c9", "#de6b5a"];
  return (
    <MultiSeriesChart
      leftLog
      series={[
        ...groups.map((g, i) => ({
          label: `since ${g.threshold}% ${direction === "declines" ? "drop" : "gain"}`,
          color: colors[i % colors.length],
          points: ds.dates.map((date, j) => ({ date, value: g.days[j] })),
        })),
        {
          label: "BTC price (log, left)",
          color: "rgba(162,147,130,0.45)",
          scale: "left" as const,
          lineWidth: 1,
          points: priceRows.map((r) => ({ date: r.date, value: r.close })),
        },
      ]}
    />
  );
}

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
    case "ytd-roi":
      return <YtdRoiChart data={loadYtdRoi()} />;
    case "monthly-returns":
      return (
        <ChartCard>
          <PeriodHeatmap
            columns={MONTHS}
            returns={loadMonthlyReturns().map((r) => ({
              year: r.year,
              period: r.month,
              pct: r.pct,
            }))}
          />
        </ChartCard>
      );
    case "quarterly-returns":
      return (
        <ChartCard>
          <PeriodHeatmap
            columns={["Q1", "Q2", "Q3", "Q4"]}
            returns={loadDistributions().quarterly.map((r) => ({
              year: r.year,
              period: r.quarter,
              pct: r.pct,
            }))}
          />
        </ChartCard>
      );
    case "monthly-average-roi": {
      const returns = loadMonthlyReturns();
      const avgs = MONTHS.map((_, i) => {
        const vals = returns.filter((r) => r.month === i + 1).map((r) => r.pct);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      });
      return (
        <CategoryBars
          categories={MONTHS}
          series={[{ label: "average", color: "#e6a144", values: avgs }]}
          showValues
        />
      );
    }
    case "historical-monthly-average-roi": {
      const returns = loadMonthlyReturns();
      const years = [...new Set(returns.map((r) => r.year))].sort();
      return (
        <CategoryBars
          categories={MONTHS}
          height={420}
          series={years.map((y, yi) => ({
            label: String(y),
            color: YEAR_PALETTE[yi % YEAR_PALETTE.length],
            values: MONTHS.map(
              (_, mi) => returns.find((r) => r.year === y && r.month === mi + 1)?.pct ?? null,
            ),
          }))}
        />
      );
    }
    case "average-daily-returns": {
      const { avgDaily } = loadDistributions();
      return (
        <CategoryBars
          categories={avgDaily.map((d) => String(d.day))}
          series={[{ label: "avg daily return", color: "#e6a144", values: avgDaily.map((d) => d.avg) }]}
        />
      );
    }
    case "price-drawdown-ath": {
      const ta = loadTa().rows;
      return (
        <MultiSeriesChart
          series={[
            {
              label: "drawdown from ATH",
              color: "#de6b5a",
              type: "area",
              points: taPoints(ta, (r) => r.drawdown),
            },
          ]}
          showLegend={false}
        />
      );
    }
    case "volatility": {
      const ta = loadTa().rows;
      return (
        <MultiSeriesChart
          series={[
            { label: "30d", color: "#e6a144", points: taPoints(ta, (r) => r.vol30, "2011-01-01") },
            { label: "60d", color: "#8ba7c9", points: taPoints(ta, (r) => r.vol60, "2011-01-01") },
            { label: "180d", color: "#b391bf", points: taPoints(ta, (r) => r.vol180, "2011-01-01") },
          ]}
        />
      );
    }
    case "moving-average-convergence-divergence": {
      const ta = loadTa().rows;
      return (
        <MultiSeriesChart
          series={[
            { label: "MACD", color: "#e6a144", points: taPoints(ta, (r) => r.macd) },
            { label: "signal", color: "#8ba7c9", points: taPoints(ta, (r) => r.macdSignal) },
            {
              label: "histogram",
              color: "rgba(162,147,130,0.5)",
              type: "histogram",
              points: taPoints(ta, (r) => r.macdHist),
            },
          ]}
          thresholds={[{ value: 0, color: "rgba(162,147,130,0.5)", label: "" }]}
        />
      );
    }
    case "bollinger-bands": {
      const ta = loadTa().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "close", color: "#e6a144", points: taPoints(ta, (r) => r.close) },
            { label: "upper", color: "rgba(222,107,90,0.55)", lineWidth: 1, points: taPoints(ta, (r) => r.bbUpper) },
            { label: "20d SMA", color: "rgba(162,147,130,0.7)", dashed: true, lineWidth: 1, points: taPoints(ta, (r) => r.bbMid) },
            { label: "lower", color: "rgba(130,181,122,0.55)", lineWidth: 1, points: taPoints(ta, (r) => r.bbLower) },
          ]}
        />
      );
    }
    case "golden-death-crosses": {
      const ta = loadTa().rows;
      const events = loadEvents().goldenDeath;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "close", color: "rgba(230,161,68,0.85)", points: taPoints(ta, (r) => r.close) },
            { label: "50d SMA", color: "#82b57a", lineWidth: 1, points: taPoints(ta, (r) => r.sma50d) },
            { label: "200d SMA", color: "#de6b5a", lineWidth: 1, points: taPoints(ta, (r) => r.sma200d) },
          ]}
          markers={events.map((e) => ({
            date: e.date,
            position: e.type === "up" ? "belowBar" : "aboveBar",
            color: e.type === "up" ? "#82b57a" : "#de6b5a",
            shape: e.type === "up" ? "arrowUp" : "arrowDown",
            text: e.type === "up" ? "golden" : "death",
          }))}
        />
      );
    }
    case "pi-cycle-bottom-top": {
      const ta = loadTa().rows;
      const events = loadEvents().piCycle.filter((e) => e.type === "up");
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "close", color: "rgba(230,161,68,0.85)", points: taPoints(ta, (r) => r.close) },
            { label: "111d SMA", color: "#82b57a", lineWidth: 1, points: taPoints(ta, (r) => r.sma111d) },
            { label: "2 × 350d SMA", color: "#de6b5a", lineWidth: 1, points: taPoints(ta, (r) => r.sma350x2) },
          ]}
          markers={events.map((e) => ({
            date: e.date,
            position: "aboveBar",
            color: "#de6b5a",
            shape: "arrowDown",
            text: "π top",
          }))}
        />
      );
    }
    case "benfords-law": {
      const { benford } = loadDistributions();
      return (
        <CategoryBars
          categories={benford.map((b) => String(b.digit))}
          series={[
            { label: "BTC daily closes", color: "#e6a144", values: benford.map((b) => b.actual) },
            { label: "Benford expected", color: "#8ba7c9", values: benford.map((b) => b.expected) },
          ]}
        />
      );
    }
    case "price-milestone-crossings":
      return (
        <MilestoneChart
          events={loadDistributions().milestones}
          dates={loadMetrics().rows.map((r) => r.date)}
        />
      );
    case "days-since-percentage-decline":
      return daysSinceBody("declines");
    case "days-since-percentage-gain":
      return daysSinceBody("gains");
    case "asymmetric-quantile-regression-fan": {
      const fan = loadFan();
      return (
        <MultiSeriesChart
          rightLog
          series={[
            {
              label: "close",
              color: "rgba(237,227,212,0.9)",
              points: rows.map((r) => ({ date: r.date, value: r.close })),
            },
            ...fan.taus.map((tau, k) => ({
              label: `τ ${tau}`,
              color: riskColor(tau),
              lineWidth: 1,
              points: fan.rows.map((r) => ({ date: r.date, value: r.q[k] })),
            })),
          ]}
        />
      );
    }
    case "risk-colorcoded":
      return (
        <RiskColoredPrice
          points={rows.map((r) => ({ date: r.date, close: r.close, risk: r.risk }))}
        />
      );
    case "risk-time": {
      const counts = new Array(10).fill(0);
      for (const r of rows) {
        if (r.risk === null) continue;
        counts[Math.min(9, Math.floor(r.risk * 10))]++;
      }
      return (
        <CategoryBars
          categories={counts.map((_, i) => `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`)}
          series={[{ label: "days", color: "#e6a144", values: counts }]}
          unit=" days"
          showValues
        />
      );
    }
    case "risk-levels": {
      const { riskLevels } = loadDistributions();
      const recent = rows.filter((r) => r.date >= "2024-01-01");
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "close", color: "#e6a144", points: recent.map((r) => ({ date: r.date, value: r.close })) },
          ]}
          thresholds={riskLevels.map((l) => ({
            value: l.price,
            color: riskColor(l.risk),
            label: `risk ${l.risk.toFixed(1)}`,
          }))}
          showLegend={false}
        />
      );
    }
    case "short-term-bubble-risk": {
      const ta = loadTa().rows;
      return (
        <MetricChart
          points={taPoints(ta, (r) => r.bubble)}
          colorByValue
          height={460}
          thresholds={[
            { value: 0.9, color: "rgba(222,107,90,0.7)", label: "frothy" },
            { value: 0.1, color: "rgba(130,181,122,0.7)", label: "washed out" },
          ]}
        />
      );
    }
    case "roi-after-halving":
      return (
        <DaysAxisChart
          log
          series={multipleSeries(loadEventRoi().halvings)}
          thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (break even)" }]}
        />
      );
    case "roi-after-cycle-bottom":
      return (
        <DaysAxisChart
          log
          series={multipleSeries(loadEventRoi().bottoms)}
          thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (break even)" }]}
        />
      );
    case "roi-after-cycle-peak":
      return (
        <DaysAxisChart
          log
          series={multipleSeries(loadEventRoi().peaks)}
          thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (break even)" }]}
        />
      );
    case "roi-after-latest-cycle-peak":
      return (
        <DaysAxisChart
          series={eventSeries(loadEventRoi().latestPeak)}
          thresholds={[{ value: 0, color: "rgba(162,147,130,0.5)", label: "break even" }]}
        />
      );
    case "cycles-deviation":
      return (
        <DaysAxisChart
          series={[{ label: "current cycle vs. prior-cycle average", color: "#e6a144", points: loadEventRoi().deviation.map((p) => ({ day: p.day, value: p.pct })) }]}
          thresholds={[{ value: 0, color: "rgba(162,147,130,0.5)", label: "on trend" }]}
        />
      );
    case "roi-bands": {
      const bands = loadRoiBands();
      const dates = rows.map((r) => r.date);
      const colors = ["#82b57a", "#8ba7c9", "#e6a144", "#de6b5a"];
      return (
        <MultiSeriesChart
          rightLog
          series={bands.map((b, i) => ({
            label: `days to ${b.multiple}×`,
            color: colors[i % colors.length],
            lineWidth: 1,
            points: dates.map((date, j) => ({ date, value: b.days[j] })),
          }))}
        />
      );
    }
    case "sma-cycle-top-breakout": {
      const { smaTopBreakouts, cyclePeaks } = loadDistributions();
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "close", color: "rgba(230,161,68,0.85)", points: rows.map((r) => ({ date: r.date, value: r.close })) },
            { label: "20W SMA", color: "#8ba7c9", lineWidth: 1, points: metricPoints(rows, (r) => r.sma20w) },
          ]}
          markers={[
            ...cyclePeaks.map((d) => ({
              date: d,
              position: "aboveBar" as const,
              color: "rgba(162,147,130,0.9)",
              shape: "arrowDown" as const,
              text: "cycle top",
            })),
            ...smaTopBreakouts.map((b) => ({
              date: b.date,
              position: "belowBar" as const,
              color: "#82b57a",
              shape: "arrowUp" as const,
              text: "MA > prev top",
            })),
          ].sort((a, b) => a.date.localeCompare(b.date))}
        />
      );
    }
    case "best-day-to-dca": {
      const { dcaWeekday } = loadDistributions();
      const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return (
        <CategoryBars
          categories={dcaWeekday.map((d) => DOW[d.dow])}
          series={[{ label: "avg extension above 50d SMA", color: "#e6a144", values: dcaWeekday.map((d) => d.avgExt) }]}
          showValues
        />
      );
    }
    case "supertrend": {
      const ta = loadTa().rows.filter((r) => r.date >= "2017-08-17");
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "close", color: "rgba(230,161,68,0.85)", points: ta.map((r) => ({ date: r.date, value: r.close })) },
            { label: "uptrend stop", color: "#82b57a", lineWidth: 1, points: ta.map((r) => ({ date: r.date, value: r.stUp })) },
            { label: "downtrend stop", color: "#de6b5a", lineWidth: 1, points: ta.map((r) => ({ date: r.date, value: r.stDown })) },
          ]}
        />
      );
    }
    default:
      notFound();
  }
}

const EVENT_COLORS = ["#8ba7c9", "#82b57a", "#e6a144", "#de6b5a", "#b391bf"];

function eventSeries(
  groups: { label: string; points: { day: number; pct: number }[] }[],
) {
  return groups.map((g, i) => ({
    label: g.label,
    color: EVENT_COLORS[i % EVENT_COLORS.length],
    points: g.points.map((p) => ({ day: p.day, value: p.pct })),
  }));
}

/** ROI as a multiple of the event-day price (1× = break even) — log-scale friendly. */
function multipleSeries(
  groups: { label: string; points: { day: number; pct: number }[] }[],
) {
  return groups.map((g, i) => ({
    label: `${g.label} (×)`,
    color: EVENT_COLORS[i % EVENT_COLORS.length],
    points: g.points.map((p) => ({ day: p.day, value: 1 + p.pct / 100 })),
  }));
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
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          {def.category} · BTC
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{def.title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">{def.description}</p>
      </header>
      <ChartBody slug={slug} />

      <section className="mt-8 max-w-3xl border-t border-line pt-6">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          Understanding this chart
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          {def.explanation.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <footer className="mt-8 text-xs text-faint">
        data through {metrics.updatedThrough} · updates daily
      </footer>
    </main>
  );
}
