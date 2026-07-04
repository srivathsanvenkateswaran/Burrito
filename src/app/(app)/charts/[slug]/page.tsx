import { notFound } from "next/navigation";
import { CHARTS, chartBySlug } from "@/lib/charts";
import {
  loadAltseason,
  loadAssetDaily,
  loadAssetsSummary,
  loadBreadth,
  loadComparisons,
  loadCorrelations,
  loadDaysSince,
  loadDistributions,
  loadDxy,
  loadEventRoi,
  loadEvents,
  loadFan,
  loadFearGreed,
  loadFedAssets,
  loadMcapAggregates,
  loadMetrics,
  loadMonthlyReturns,
  loadOnchainBtc,
  loadOnchainEth,
  loadPortfolios,
  loadRoiBands,
  loadWiki,
  onchainPoints,
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
import AssetTable from "@/components/AssetTable";
import CryptoHeatmap from "@/components/CryptoHeatmap";
import CorrelationMatrix from "@/components/CorrelationMatrix";
import MaStrengthTable from "@/components/MaStrengthTable";
import HypotheticalsTable from "@/components/HypotheticalsTable";

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
    case "fear-greed-index": {
      const fng = new Map(loadFearGreed().rows.map((r) => [r.date, r.value]));
      return (
        <RiskColoredPrice
          points={rows.map((r) => {
            const v = fng.get(r.date);
            // riskColor is green→red over 0..1, so invert: greed green, fear red
            return { date: r.date, close: r.close, risk: v === undefined ? null : 1 - v / 100 };
          })}
          legendText="extreme greed → extreme fear"
        />
      );
    }
    case "risk-dashboard":
      return <AssetTable assets={loadAssetsSummary().assets} />;
    case "heatmap":
      return <CryptoHeatmap assets={loadAssetsSummary().assets} />;
    case "market-capitalization-hypotheticals":
      return <HypotheticalsTable assets={loadAssetsSummary().assets} />;
    case "color-coded-moving-average-strength":
      return <MaStrengthTable assets={loadAssetsSummary().assets} />;
    case "correlation-coefficients": {
      const { ids, matrix } = loadCorrelations();
      return <CorrelationMatrix ids={ids} matrix={matrix} />;
    }
    case "portfolios-weighted-by-market-cap": {
      const pf = loadPortfolios().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "top 5 (mcap-weighted)", color: "#e6a144", points: pf.map((r) => ({ date: r.date, value: r.top5 })) },
            { label: "top 10", color: "#8ba7c9", points: pf.map((r) => ({ date: r.date, value: r.top10 })) },
            { label: "top 20", color: "#b391bf", points: pf.map((r) => ({ date: r.date, value: r.top20 })) },
            { label: "BTC only", color: "#82b57a", points: pf.map((r) => ({ date: r.date, value: r.btc })) },
          ]}
          thresholds={[{ value: 100, color: "rgba(162,147,130,0.5)", label: "start (2019)" }]}
        />
      );
    }
    case "advance-decline-ratios": {
      const b = loadBreadth().rows;
      return (
        <MetricChart
          points={b.flatMap((r) => (r.advPct === null ? [] : [{ date: r.date, value: r.advPct }]))}
          height={460}
          thresholds={[{ value: 50, color: "rgba(162,147,130,0.5)", label: "even" }]}
        />
      );
    }
    case "advance-decline-index": {
      const b = loadBreadth().rows;
      return (
        <MetricChart
          points={b.map((r) => ({ date: r.date, value: r.adi }))}
          color="#8ba7c9"
          height={460}
        />
      );
    }
    case "absolute-breadth-index": {
      const b = loadBreadth().rows;
      return (
        <MultiSeriesChart
          series={[{ label: "|advances − declines|", color: "#b391bf", type: "histogram", points: b.map((r) => ({ date: r.date, value: r.abi })) }]}
        />
      );
    }
    case "above-below-ma": {
      const b = loadBreadth().rows;
      return (
        <MetricChart
          points={b.flatMap((r) => (r.above20wPct === null ? [] : [{ date: r.date, value: r.above20wPct }]))}
          colorByValue
          height={460}
          thresholds={[
            { value: 80, color: "rgba(222,107,90,0.7)", label: "broad bull" },
            { value: 20, color: "rgba(130,181,122,0.7)", label: "washout" },
          ]}
        />
      );
    }
    case "does-it-bleed": {
      const anchor = "2024-07-01";
      const btcSeries = loadMetrics().rows.filter((r) => r.date >= anchor);
      const btcMap = new Map(btcSeries.map((r) => [r.date, r.close]));
      const btcBase = btcSeries[0].close;
      const majors = ["eth", "sol", "bnb", "xrp", "ada", "doge", "link", "avax"];
      const summary = loadAssetsSummary().assets.filter((a) => a.id !== "btc" && !a.stale);
      return (
        <DaysAxisChart
          log
          series={summary.map((a, i) => {
            const rows = loadAssetDaily(a.id).rows.filter((r) => r.date >= anchor);
            const base = rows[0];
            const baseRatio = base ? base.close / (btcMap.get(base.date) ?? btcBase) : 1;
            return {
              label: a.symbol,
              color: ASSET_PALETTE[i % ASSET_PALETTE.length],
              points: rows.flatMap((r, day) => {
                const b = btcMap.get(r.date);
                return b ? [{ day, value: Number((r.close / b / baseRatio).toFixed(4)) }] : [];
              }),
            };
          })}
          defaultHidden={summary.filter((a) => !majors.includes(a.id)).map((a) => a.symbol)}
          thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "vs BTC breakeven" }]}
        />
      );
    }
    case "roi-after-bottom-comparison":
      return comparisonChart(loadComparisons().fromBottom, ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-cycle-bottom-for-crypto-pairs":
      return comparisonChart(loadComparisons().pairsFromBottom, ["ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-inception-comparison":
      return comparisonChart(loadComparisons().inception, ["BTC", "ETH", "SOL", "DOGE", "LINK"]);
    case "roi-after-inception-for-crypto-pairs":
      return comparisonChart(loadComparisons().pairsInception, ["ETH", "SOL", "DOGE", "LINK"]);
    case "roi-after-latest-cycle-peak":
      return comparisonChart(loadComparisons().fromPeak, ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-latest-cycle-peak-for-crypto-pairs":
      return comparisonChart(loadComparisons().pairsFromPeak, ["ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-sub-cycle-bottom":
      return (
        <DaysAxisChart
          log
          series={loadComparisons().ethSubCycle.map((l, i) => ({
            label: l.id,
            color: ASSET_PALETTE[i % ASSET_PALETTE.length],
            points: l.points.map((p) => ({ day: p.day, value: p.mult })),
          }))}
          thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (bottom)" }]}
        />
      );
    case "mvrv": {
      const oc = loadOnchainBtc().rows;
      return (
        <MetricChart
          points={onchainPoints(oc, (r) => r.mvrv, "2011-01-01")}
          height={460}
          thresholds={[
            { value: 3.5, color: "rgba(222,107,90,0.7)", label: "euphoria" },
            { value: 1, color: "rgba(130,181,122,0.7)", label: "cost basis" },
          ]}
        />
      );
    }
    case "mvrv-z-score": {
      const oc = loadOnchainBtc().rows;
      return (
        <MetricChart
          points={onchainPoints(oc, (r) => r.mvrvZ, "2011-01-01")}
          color="#8ba7c9"
          height={460}
          thresholds={[
            { value: 7, color: "rgba(222,107,90,0.7)", label: "top zone" },
            { value: 0.1, color: "rgba(130,181,122,0.7)", label: "deep value" },
          ]}
        />
      );
    }
    case "nupl": {
      const oc = loadOnchainBtc().rows;
      return (
        <MetricChart
          points={onchainPoints(oc, (r) => r.nupl, "2011-01-01")}
          colorByValue
          height={460}
          thresholds={[
            { value: 0.75, color: "rgba(222,107,90,0.7)", label: "euphoria" },
            { value: 0, color: "rgba(130,181,122,0.7)", label: "capitulation" },
          ]}
        />
      );
    }
    case "puell-multiple": {
      const oc = loadOnchainBtc().rows;
      return (
        <MetricChart
          points={onchainPoints(oc, (r) => r.puell, "2011-01-01")}
          height={460}
          thresholds={[
            { value: 4, color: "rgba(222,107,90,0.7)", label: "miner euphoria" },
            { value: 0.5, color: "rgba(130,181,122,0.7)", label: "miner stress" },
          ]}
        />
      );
    }
    case "stock-to-flow": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          rightLog
          leftLog
          series={[
            { label: "stock-to-flow", color: "#e6a144", points: onchainPoints(oc, (r) => r.s2f, "2011-01-01") },
            { label: "price (left)", color: "rgba(162,147,130,0.5)", scale: "left", lineWidth: 1, points: onchainPoints(oc, (r) => r.price, "2011-01-01") },
          ]}
        />
      );
    }
    case "issuance": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "issuance $/day (log, right)", color: "#e6a144", points: onchainPoints(oc, (r) => r.issUsd, "2010-10-01") },
            { label: "annual inflation % (left)", color: "#8ba7c9", scale: "left", lineWidth: 1, points: onchainPoints(oc, (r) => r.inflPct, "2010-10-01") },
          ]}
        />
      );
    }
    case "supply-eth-btc": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return (
        <MultiSeriesChart
          series={[
            { label: "BTC supply", color: "#e6a144", points: onchainPoints(btc, (r) => r.splyCur) },
            { label: "ETH supply", color: "#8ba7c9", points: onchainPoints(eth, (r) => r.splyCur) },
          ]}
        />
      );
    }
    case "address-activity": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "BTC active addresses", color: "#e6a144", points: onchainPoints(btc, (r) => r.adrAct, "2011-01-01") },
            { label: "ETH active addresses", color: "#8ba7c9", points: onchainPoints(eth, (r) => r.adrAct) },
          ]}
        />
      );
    }
    case "transfer-count-statistics": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "transactions/day", color: "#e6a144", points: onchainPoints(oc, (r) => r.txCnt, "2011-01-01") },
            { label: "value transfers/day", color: "#8ba7c9", lineWidth: 1, points: onchainPoints(oc, (r) => r.txTfrCnt, "2011-01-01") },
          ]}
        />
      );
    }
    case "transaction-fees": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "BTC fees $/day", color: "#e6a144", points: onchainPoints(btc, (r) => r.feesUsd, "2011-01-01") },
            { label: "ETH fees $/day", color: "#8ba7c9", points: onchainPoints(eth, (r) => r.feesUsd) },
          ]}
        />
      );
    }
    case "hash-rate": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[{ label: "hash rate (TH/s)", color: "#e6a144", points: onchainPoints(oc, (r) => r.hashRate, "2010-01-01") }]}
        />
      );
    }
    case "hash-ribbons": {
      const { rows: oc, ribbonEvents } = loadOnchainBtc();
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "hash rate 30d MA", color: "#82b57a", points: onchainPoints(oc, (r) => r.hashSma30, "2011-01-01") },
            { label: "hash rate 60d MA", color: "#de6b5a", points: onchainPoints(oc, (r) => r.hashSma60, "2011-01-01") },
            { label: "hash rate", color: "rgba(162,147,130,0.35)", lineWidth: 1, points: onchainPoints(oc, (r) => r.hashRate, "2011-01-01") },
          ]}
          markers={ribbonEvents
            .filter((e) => e.date >= "2011-01-01")
            .map((e) => ({
              date: e.date,
              position: e.type === "up" ? ("belowBar" as const) : ("aboveBar" as const),
              color: e.type === "up" ? "#82b57a" : "#de6b5a",
              shape: e.type === "up" ? ("arrowUp" as const) : ("arrowDown" as const),
            }))}
        />
      );
    }
    case "hash-over-price": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[{ label: "hash rate / price", color: "#b391bf", points: onchainPoints(oc, (r) => r.hashOverPrice, "2011-01-01") }]}
        />
      );
    }
    case "miner-revenue": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[{ label: "miner revenue $/day", color: "#e6a144", points: onchainPoints(oc, (r) => r.minerRev) }]}
        />
      );
    }
    case "mcap-thermocap": {
      const oc = loadOnchainBtc().rows;
      return (
        <MetricChart points={onchainPoints(oc, (r) => r.mctc, "2011-01-01")} height={460} />
      );
    }
    case "rcap-thermocap": {
      const oc = loadOnchainBtc().rows;
      return (
        <MetricChart points={onchainPoints(oc, (r) => r.rctc, "2011-01-01")} color="#8ba7c9" height={460} />
      );
    }
    case "block": {
      const oc = loadOnchainBtc().rows;
      return (
        <MultiSeriesChart
          series={[
            { label: "blocks/day", color: "#e6a144", lineWidth: 1, points: onchainPoints(oc, (r) => r.blkCnt, "2011-01-01") },
            { label: "avg block size MB (left)", color: "#8ba7c9", scale: "left", points: onchainPoints(oc, (r) => r.blockSizeMb, "2011-01-01") },
          ]}
        />
      );
    }
    case "exchange-supply": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return (
        <MultiSeriesChart
          series={[
            { label: "BTC on exchanges", color: "#e6a144", points: onchainPoints(btc, (r) => r.splyExNtv, "2012-01-01") },
            { label: "ETH on exchanges (left)", color: "#8ba7c9", scale: "left", points: onchainPoints(eth, (r) => r.splyExNtv) },
          ]}
        />
      );
    }
    case "exchange-flow": {
      const oc = loadOnchainBtc().rows.filter((r) => r.date >= "2013-01-01");
      return (
        <MultiSeriesChart
          series={[
            { label: "net flow $/day", color: "rgba(162,147,130,0.6)", type: "histogram", points: oc.map((r) => ({ date: r.date, value: r.flowNetExUsd })) },
            { label: "inflow $/day", color: "#de6b5a", lineWidth: 1, points: oc.map((r) => ({ date: r.date, value: r.flowInExUsd })) },
            { label: "outflow $/day", color: "#82b57a", lineWidth: 1, points: oc.map((r) => ({ date: r.date, value: r.flowOutExUsd })) },
          ]}
        />
      );
    }
    case "wikipedia-page-views": {
      const articles = ["bitcoin", "ethereum", "cryptocurrency", "blockchain"];
      const colors = ["#e6a144", "#8ba7c9", "#82b57a", "#b391bf"];
      return (
        <MultiSeriesChart
          rightLog
          series={articles.map((a, i) => ({
            label: a,
            color: colors[i],
            lineWidth: 1,
            points: loadWiki(a).rows.map((r) => ({ date: r.date, value: r.views })),
          }))}
        />
      );
    }
    case "dominance": {
      const agg = loadMcapAggregates().rows;
      return (
        <MultiSeriesChart
          series={[
            { label: "BTC dominance %", color: "#e6a144", points: agg.map((r) => ({ date: r.date, value: r.btcDom })) },
            { label: "ETH dominance %", color: "#8ba7c9", points: agg.map((r) => ({ date: r.date, value: r.ethDom })) },
          ]}
        />
      );
    }
    case "market-cap-logarithmic-regression": {
      const agg = loadMcapAggregates().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "total mcap $B", color: "#e6a144", points: agg.map((r) => ({ date: r.date, value: r.total })) },
            { label: "median fit", color: "#c9bba6", dashed: true, lineWidth: 1, points: agg.map((r) => ({ date: r.date, value: r.fair })) },
            { label: "τ 0.15", color: "rgba(130,181,122,0.6)", lineWidth: 1, points: agg.map((r) => ({ date: r.date, value: r.fairLow })) },
            { label: "τ 0.85", color: "rgba(222,107,90,0.6)", lineWidth: 1, points: agg.map((r) => ({ date: r.date, value: r.fairHigh })) },
          ]}
        />
      );
    }
    case "market-cap-vs-fair-value": {
      const agg = loadMcapAggregates().rows;
      return (
        <MetricChart
          points={agg.map((r) => ({ date: r.date, value: Number((r.total / r.fair).toFixed(3)) }))}
          height={460}
          thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "on trend" }]}
        />
      );
    }
    case "altcoin-market-capitalizations": {
      const agg = loadMcapAggregates().rows;
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "total − BTC ($B)", color: "#8ba7c9", points: agg.map((r) => ({ date: r.date, value: r.alt })) },
            { label: "total − BTC/ETH/stables ($B)", color: "#b391bf", points: agg.map((r) => ({ date: r.date, value: r.altExEthStables })) },
          ]}
        />
      );
    }
    case "ssr": {
      const agg = loadMcapAggregates().rows.filter((r) => r.ssr !== null && r.date >= "2017-01-01");
      return (
        <MetricChart
          points={agg.map((r) => ({ date: r.date, value: r.ssr! }))}
          color="#8ba7c9"
          height={460}
        />
      );
    }
    case "altcoin-season-index": {
      return (
        <MetricChart
          points={loadAltseason().rows.map((r) => ({ date: r.date, value: r.value }))}
          height={460}
          thresholds={[
            { value: 75, color: "rgba(130,181,122,0.7)", label: "altcoin season" },
            { value: 25, color: "rgba(222,107,90,0.7)", label: "bitcoin season" },
          ]}
        />
      );
    }
    case "qt-ending-bear-markets": {
      const fed = loadFedAssets().rows.filter((r) => r.date >= "2014-01-01");
      const QT = [
        { date: "2017-10-04", type: "start" as const, label: "QT1 starts" },
        { date: "2019-08-01", type: "end" as const, label: "QT1 ends" },
        { date: "2022-06-01", type: "start" as const, label: "QT2 starts" },
        { date: "2025-12-31", type: "end" as const, label: "QT2 ends" },
      ];
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "BTC/USD (log, right)", color: "#e6a144", points: rows.filter((r) => r.date >= "2014-01-01").map((r) => ({ date: r.date, value: r.close })) },
            { label: "Fed total assets, $B (left)", color: "#8ba7c9", scale: "left", lineWidth: 1, points: fed.map((r) => ({ date: r.date, value: r.value })) },
          ]}
          markers={QT.map((q) => ({
            date: q.date,
            position: q.type === "start" ? "aboveBar" : "belowBar",
            color: q.type === "start" ? "#de6b5a" : "#82b57a",
            shape: q.type === "start" ? "arrowDown" : "arrowUp",
            text: q.label,
          }))}
        />
      );
    }
    case "btc-vs-dxy": {
      const dxyRows = loadDxy().rows.filter((r) => r.date >= "2010-08-18");
      return (
        <MultiSeriesChart
          rightLog
          series={[
            { label: "BTC/USD (log, right)", color: "#e6a144", points: rows.map((r) => ({ date: r.date, value: r.close })) },
            { label: "DXY (left)", color: "#8ba7c9", scale: "left", lineWidth: 1, points: dxyRows.map((r) => ({ date: r.date, value: r.close })) },
          ]}
        />
      );
    }
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

const ASSET_PALETTE = [
  "#e6a144", "#8ba7c9", "#82b57a", "#de6b5a", "#b391bf", "#7fb5a8",
  "#c07a4a", "#a8a862", "#cf8fa8", "#ede3d4", "#909c6b", "#c9a06a",
];

/** Multi-asset comparison on a days axis: log multiples, majors visible by default. */
function comparisonChart(lines: { id: string; points: { day: number; mult: number }[] }[], defaultVisible: string[]) {
  const series = lines.map((l, i) => ({
    label: l.id.toUpperCase(),
    color: ASSET_PALETTE[i % ASSET_PALETTE.length],
    lineWidth: 1 as const,
    points: l.points.map((p) => ({ day: p.day, value: p.mult })),
  }));
  return (
    <DaysAxisChart
      log
      series={series}
      defaultHidden={series.map((s) => s.label).filter((l) => !defaultVisible.includes(l))}
      thresholds={[{ value: 1, color: "rgba(162,147,130,0.5)", label: "1×" }]}
    />
  );
}

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
