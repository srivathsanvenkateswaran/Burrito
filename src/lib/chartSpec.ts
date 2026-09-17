/**
 * Pure data shaping for every chart page, split out of the old server-rendered
 * ChartBody so the result can be written to a static JSON file at build time
 * (scripts/build-chart-data.ts) and fetched by the browser instead of being
 * inlined into every page's HTML and RSC payload.
 *
 * `chartSpec(slug, asset)` returns a serializable `ChartSpec`: a list of blocks,
 * each naming a chart component (`kind`) and carrying that component's props.
 * `src/components/chart-page/ChartRenderer.tsx` turns the blocks back into JSX.
 *
 * Reads data through `./data`, so this module is server/build-only. The client
 * imports the *types* below (erased at compile time), never the functions.
 */
import { riskColor } from "./colors";
import {
  loadAltseason,
  loadAssetDaily,
  loadAssetsSummary,
  loadBreadth,
  loadComparisons,
  loadCorrelations,
  loadCrossAsset,
  loadCrossCorrelations,
  loadDaysSince,
  loadDerivs,
  loadFred,
  yoy,
  loadDistributions,
  loadDxy,
  loadEventRoi,
  loadEvents,
  loadFan,
  loadFearGreed,
  loadFedAssets,
  hasMetrics,
  loadMcapAggregates,
  loadMetrics,
  loadMonthlyReturns,
  loadOnchainBtc,
  loadOnchainEth,
  loadPortfolios,
  loadRoiBands,
  loadSupply,
  loadWiki,
  onchainPoints,
  loadTa,
  loadYtdRoi,
  metricPoints,
  taPoints,
  type AssetSummary,
} from "./data";
import type { ChartMarker, SeriesDef } from "../components/MultiSeriesChart";
import type { MetricPoint } from "../components/MetricChart";
import type { MetricRow } from "../components/PriceChart";
import type { RiskPricePoint } from "../components/RiskColoredPrice";
import type { DaySeries } from "../components/DaysAxisChart";
import type { MilestoneEvent } from "../components/MilestoneChart";
import type { YearSeries } from "../components/YtdRoiChart";
import type { PeriodReturn } from "../components/PeriodHeatmap";
import type { BarSeries } from "../components/CategoryBars";
import type { ChartPageAsset } from "../components/chart-page/types";

export interface Threshold {
  value: number;
  color: string;
  label: string;
}

export interface MultiSeriesProps {
  series: SeriesDef[];
  markers?: ChartMarker[];
  thresholds?: Threshold[];
  rightLog?: boolean;
  leftLog?: boolean;
  height?: number;
  showLegend?: boolean;
}

export interface MetricProps {
  points: MetricPoint[];
  color?: string;
  colorByValue?: boolean;
  thresholds?: Threshold[];
  height?: number;
}

export interface PriceProps {
  rows: MetricRow[];
}

export interface RiskColoredProps {
  points: RiskPricePoint[];
  legendText?: string;
  gradientCss?: string;
}

export interface DaysAxisProps {
  series: DaySeries[];
  log?: boolean;
  thresholds?: Threshold[];
  height?: number;
  defaultHidden?: string[];
}

export interface MilestoneProps {
  events: MilestoneEvent[];
  dates: string[];
}

export interface YtdRoiProps {
  data: YearSeries[];
  showCryptoCyclePresets?: boolean;
}

export interface PeriodHeatmapProps {
  columns: string[];
  returns: PeriodReturn[];
}

export interface CategoryBarsProps {
  categories: string[];
  series: BarSeries[];
  unit?: string;
  height?: number;
  showValues?: boolean;
}

export interface AssetTableProps {
  assets: AssetSummary[];
  hideMcap?: boolean;
}

export interface AssetListProps {
  assets: AssetSummary[];
}

export interface CorrelationMatrixProps {
  ids: string[];
  matrix: (number | null)[][];
}

export interface TextProps {
  text: string;
}

/** One rendered unit of a chart page: a component name plus its (JSON-safe) props. */
export type Block =
  | { kind: "multi-series"; props: MultiSeriesProps }
  | { kind: "metric"; props: MetricProps }
  | { kind: "price"; props: PriceProps }
  | { kind: "risk-colored"; props: RiskColoredProps }
  | { kind: "days-axis"; props: DaysAxisProps }
  | { kind: "milestone"; props: MilestoneProps }
  | { kind: "ytd-roi"; props: YtdRoiProps }
  | { kind: "period-heatmap"; props: PeriodHeatmapProps }
  | { kind: "category-bars"; props: CategoryBarsProps }
  | { kind: "asset-table"; props: AssetTableProps }
  | { kind: "crypto-heatmap"; props: AssetListProps }
  | { kind: "correlation-matrix"; props: CorrelationMatrixProps }
  | { kind: "ma-strength"; props: AssetListProps }
  | { kind: "hypotheticals"; props: AssetListProps }
  | { kind: "note"; props: TextProps }
  | { kind: "heading"; props: TextProps };

export interface ChartSpec {
  blocks: Block[];
}

const one = (block: Block): ChartSpec => ({ blocks: [block] });
const note = (text: string): ChartSpec => one({ kind: "note", props: { text } });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_PALETTE = [
  "#e6a144", "#8ba7c9", "#82b57a", "#de6b5a", "#b391bf", "#7fb5a8",
  "#c07a4a", "#a8a862", "#cf8fa8", "#ede3d4", "#909c6b", "#c9a06a",
];

const EVENT_COLORS = ["#8ba7c9", "#82b57a", "#e6a144", "#de6b5a", "#b391bf"];

const ASSET_PALETTE = [
  "#e6a144", "#8ba7c9", "#82b57a", "#de6b5a", "#b391bf", "#7fb5a8",
  "#c07a4a", "#a8a862", "#cf8fa8", "#ede3d4", "#909c6b", "#c9a06a",
];

function daysSinceSpec(direction: "declines" | "gains", asset: ChartPageAsset): ChartSpec {
  const ds = loadDaysSince(asset.id);
  const groups = ds[direction];
  const priceRows = loadMetrics(asset.id).rows;
  const colors = ["#e6a144", "#8ba7c9", "#de6b5a"];
  return one({
    kind: "multi-series",
    props: {
      leftLog: true,
      series: [
        ...groups.map((g, i) => ({
          label: `since ${g.threshold}% ${direction === "declines" ? "drop" : "gain"}`,
          color: colors[i % colors.length],
          points: ds.dates.map((date, j) => ({ date, value: g.days[j] })),
        })),
        {
          label: `${asset.symbol} price (log, left)`,
          color: "rgba(162,147,130,0.45)",
          scale: "left" as const,
          lineWidth: 1,
          points: priceRows.map((r) => ({ date: r.date, value: r.close })),
        },
      ],
    },
  });
}

/** Multi-asset comparison on a days axis: log multiples, majors visible by default. */
function comparisonSpec(
  lines: { id: string; points: { day: number; mult: number }[] }[],
  defaultVisible: string[],
): ChartSpec {
  const series: DaySeries[] = lines.map((l, i) => ({
    label: l.id.toUpperCase(),
    color: ASSET_PALETTE[i % ASSET_PALETTE.length],
    lineWidth: 1,
    points: l.points.map((p) => ({ day: p.day, value: p.mult })),
  }));
  return one({
    kind: "days-axis",
    props: {
      log: true,
      series,
      defaultHidden: series.map((s) => s.label).filter((l) => !defaultVisible.includes(l)),
      thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "1×" }],
    },
  });
}

function eventSeries(groups: { label: string; points: { day: number; pct: number }[] }[]): DaySeries[] {
  return groups.map((g, i) => ({
    label: g.label,
    color: EVENT_COLORS[i % EVENT_COLORS.length],
    points: g.points.map((p) => ({ day: p.day, value: p.pct })),
  }));
}

/** ROI as a multiple of the event-day price (1× = break even) — log-scale friendly. */
function multipleSeries(groups: { label: string; points: { day: number; pct: number }[] }[]): DaySeries[] {
  return groups.map((g, i) => ({
    label: `${g.label} (×)`,
    color: EVENT_COLORS[i % EVENT_COLORS.length],
    points: g.points.map((p) => ({ day: p.day, value: 1 + p.pct / 100 })),
  }));
}

/** Simple moving average over a window of positions (not calendar days); gaps propagate as null. */
function sma(points: { date: string; value: number | null }[], window: number) {
  return points.map((p, i) => {
    if (i < window - 1) return { date: p.date, value: null as number | null };
    let sum = 0;
    for (let k = i - window + 1; k <= i; k++) {
      const v = points[k].value;
      if (v === null) return { date: p.date, value: null as number | null };
      sum += v;
    }
    return { date: p.date, value: sum / window };
  });
}

/**
 * The PriceChart shown on `/dashboard` and `/assets/[asset]`, as a spec. Assets
 * whose fitted suite hasn't been computed yet (a very recent listing) fall back
 * to the raw close series, matching what the asset page used to render inline.
 */
export function priceSpec(assetId: string, symbol: string): ChartSpec {
  if (hasMetrics(assetId)) {
    return one({ kind: "price", props: { rows: loadMetrics(assetId).rows } });
  }
  const { rows } = loadAssetDaily(assetId);
  return one({
    kind: "multi-series",
    props: {
      series: [
        {
          label: `${symbol} close`,
          color: "#e6a144",
          points: rows.map((r) => ({ date: r.date, value: r.close })),
        },
      ],
    },
  });
}

/**
 * Everything one chart page renders below its header, as serializable blocks.
 * Returns null for a slug this module doesn't know (the route layer already
 * 404s those).
 */
export function chartSpec(slug: string, asset: ChartPageAsset): ChartSpec | null {
  // Supply-only assets (usdt) have no daily.json — only the stablecoin-supply
  // case runs for them, and it doesn't touch `rows`.
  const { rows } = hasMetrics(asset.id) ? loadMetrics(asset.id) : { rows: [] };
  switch (slug) {
    case "price":
      return one({ kind: "price", props: { rows } });
    case "volume": {
      const daily = loadAssetDaily(asset.id).rows;
      const vol = daily.map((r) => ({ date: r.date, value: r.volumeUsd ?? r.volume ?? null }));
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: `${asset.symbol} volume`, color: "rgba(139,167,201,0.55)", type: "histogram", points: vol },
            { label: "30-period SMA", color: "#e6a144", lineWidth: 1, points: sma(vol, 30) },
          ],
        },
      });
    }
    case "vs-benchmark": {
      const benchId = asset.benchmark;
      if (!benchId) return note(`No benchmark is configured for ${asset.symbol}.`);
      const benchSymbol =
        loadAssetsSummary().assets.find((a) => a.id === benchId)?.symbol ?? benchId.toUpperCase();
      const benchRows = loadMetrics(benchId).rows;
      const benchMap = new Map(benchRows.map((r) => [r.date, r.close]));
      const common = rows.flatMap((r) => {
        const b = benchMap.get(r.date);
        return b ? [{ date: r.date, ratio: r.close / b }] : [];
      });
      if (common.length === 0) {
        return note(`No overlapping history between ${asset.symbol} and ${benchSymbol} yet.`);
      }
      const base = common[0].ratio;
      const ratioPoints = common.map((c) => ({ date: c.date, value: c.ratio / base }));
      const ratioSma = sma(ratioPoints, 90);
      const relStrength = ratioPoints.map((p, i) => {
        const s = ratioSma[i].value;
        if (p.value === null || s === null || s === 0) return { date: p.date, value: null as number | null };
        return { date: p.date, value: Number(((p.value / s - 1) * 100).toFixed(3)) };
      });
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: `${asset.symbol} / ${benchSymbol}`, color: "#e6a144", points: ratioPoints },
            {
              label: "90-period relative strength %",
              color: "#8ba7c9",
              scale: "left",
              lineWidth: 1,
              points: relStrength,
            },
          ],
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (breakeven)" }],
        },
      });
    }
    case "risk":
      return one({
        kind: "metric",
        props: {
          points: metricPoints(rows, (r) => r.risk),
          colorByValue: true,
          height: 460,
          thresholds: [
            { value: 0.8, color: "rgba(222,107,90,0.7)", label: "take profit" },
            { value: 0.2, color: "rgba(130,181,122,0.7)", label: "accumulate" },
          ],
        },
      });
    case "mayer":
      return one({
        kind: "metric",
        props: {
          points: metricPoints(rows, (r) => r.mayer, "2013-01-01"),
          color: "#8ba7c9",
          height: 460,
          thresholds: [
            { value: 2.4, color: "rgba(222,107,90,0.7)", label: "hot" },
            { value: 0.8, color: "rgba(130,181,122,0.7)", label: "cheap" },
          ],
        },
      });
    case "rsi":
      return one({
        kind: "metric",
        props: {
          points: metricPoints(rows, (r) => r.rsi14),
          color: "#b391bf",
          height: 460,
          thresholds: [
            { value: 70, color: "rgba(222,107,90,0.7)", label: "overbought" },
            { value: 30, color: "rgba(130,181,122,0.7)", label: "oversold" },
          ],
        },
      });
    case "running-roi":
      return one({
        kind: "metric",
        props: {
          points: metricPoints(rows, (r) => r.roi1y, "2013-01-01"),
          color: "#82b57a",
          height: 460,
          thresholds: [{ value: 0, color: "rgba(162,147,130,0.5)", label: "breakeven" }],
        },
      });
    case "ytd-roi":
      return one({
        kind: "ytd-roi",
        props: { data: loadYtdRoi(asset.id), showCryptoCyclePresets: asset.class === "crypto" },
      });
    case "monthly-returns":
      return one({
        kind: "period-heatmap",
        props: {
          columns: MONTHS,
          returns: loadMonthlyReturns(asset.id).map((r) => ({
            year: r.year,
            period: r.month,
            pct: r.pct,
          })),
        },
      });
    case "quarterly-returns":
      return one({
        kind: "period-heatmap",
        props: {
          columns: ["Q1", "Q2", "Q3", "Q4"],
          returns: loadDistributions(asset.id).quarterly.map((r) => ({
            year: r.year,
            period: r.quarter,
            pct: r.pct,
          })),
        },
      });
    case "monthly-average-roi": {
      const returns = loadMonthlyReturns(asset.id);
      const avgs = MONTHS.map((_, i) => {
        const vals = returns.filter((r) => r.month === i + 1).map((r) => r.pct);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      });
      return one({
        kind: "category-bars",
        props: {
          categories: MONTHS,
          series: [{ label: "average", color: "#e6a144", values: avgs }],
          showValues: true,
        },
      });
    }
    case "historical-monthly-average-roi": {
      const returns = loadMonthlyReturns(asset.id);
      const years = [...new Set(returns.map((r) => r.year))].sort();
      return one({
        kind: "category-bars",
        props: {
          categories: MONTHS,
          height: 420,
          series: years.map((y, yi) => ({
            label: String(y),
            color: YEAR_PALETTE[yi % YEAR_PALETTE.length],
            values: MONTHS.map(
              (_, mi) => returns.find((r) => r.year === y && r.month === mi + 1)?.pct ?? null,
            ),
          })),
        },
      });
    }
    case "average-daily-returns": {
      const { avgDaily } = loadDistributions(asset.id);
      return one({
        kind: "category-bars",
        props: {
          categories: avgDaily.map((d) => String(d.day)),
          series: [{ label: "avg daily return", color: "#e6a144", values: avgDaily.map((d) => d.avg) }],
        },
      });
    }
    case "price-drawdown-ath": {
      const ta = loadTa(asset.id).rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            {
              label: "drawdown from ATH",
              color: "#de6b5a",
              type: "area",
              points: taPoints(ta, (r) => r.drawdown),
            },
          ],
          showLegend: false,
        },
      });
    }
    case "volatility": {
      const ta = loadTa(asset.id).rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "30d", color: "#e6a144", points: taPoints(ta, (r) => r.vol30, "2011-01-01") },
            { label: "60d", color: "#8ba7c9", points: taPoints(ta, (r) => r.vol60, "2011-01-01") },
            { label: "180d", color: "#b391bf", points: taPoints(ta, (r) => r.vol180, "2011-01-01") },
          ],
        },
      });
    }
    case "moving-average-convergence-divergence": {
      const ta = loadTa(asset.id).rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "MACD", color: "#e6a144", points: taPoints(ta, (r) => r.macd) },
            { label: "signal", color: "#8ba7c9", points: taPoints(ta, (r) => r.macdSignal) },
            {
              label: "histogram",
              color: "rgba(162,147,130,0.5)",
              type: "histogram",
              points: taPoints(ta, (r) => r.macdHist),
            },
          ],
          thresholds: [{ value: 0, color: "rgba(162,147,130,0.5)", label: "" }],
        },
      });
    }
    case "bollinger-bands": {
      const ta = loadTa(asset.id).rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "close", color: "#e6a144", points: taPoints(ta, (r) => r.close) },
            { label: "upper", color: "rgba(222,107,90,0.55)", lineWidth: 1, points: taPoints(ta, (r) => r.bbUpper) },
            { label: "20d SMA", color: "rgba(162,147,130,0.7)", dashed: true, lineWidth: 1, points: taPoints(ta, (r) => r.bbMid) },
            { label: "lower", color: "rgba(130,181,122,0.55)", lineWidth: 1, points: taPoints(ta, (r) => r.bbLower) },
          ],
        },
      });
    }
    case "golden-death-crosses": {
      const ta = loadTa(asset.id).rows;
      const events = loadEvents(asset.id).goldenDeath;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "close", color: "rgba(230,161,68,0.85)", points: taPoints(ta, (r) => r.close) },
            { label: "50d SMA", color: "#82b57a", lineWidth: 1, points: taPoints(ta, (r) => r.sma50d) },
            { label: "200d SMA", color: "#de6b5a", lineWidth: 1, points: taPoints(ta, (r) => r.sma200d) },
          ],
          markers: events.map((e) => ({
            date: e.date,
            position: e.type === "up" ? ("belowBar" as const) : ("aboveBar" as const),
            color: e.type === "up" ? "#82b57a" : "#de6b5a",
            shape: e.type === "up" ? ("arrowUp" as const) : ("arrowDown" as const),
            text: e.type === "up" ? "golden" : "death",
          })),
        },
      });
    }
    case "pi-cycle-bottom-top": {
      const ta = loadTa(asset.id).rows;
      const events = loadEvents(asset.id).piCycle.filter((e) => e.type === "up");
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "close", color: "rgba(230,161,68,0.85)", points: taPoints(ta, (r) => r.close) },
            { label: "111d SMA", color: "#82b57a", lineWidth: 1, points: taPoints(ta, (r) => r.sma111d) },
            { label: "2 × 350d SMA", color: "#de6b5a", lineWidth: 1, points: taPoints(ta, (r) => r.sma350x2) },
          ],
          markers: events.map((e) => ({
            date: e.date,
            position: "aboveBar" as const,
            color: "#de6b5a",
            shape: "arrowDown" as const,
            text: "π top",
          })),
        },
      });
    }
    case "benfords-law": {
      const { benford } = loadDistributions(asset.id);
      return one({
        kind: "category-bars",
        props: {
          categories: benford.map((b) => String(b.digit)),
          series: [
            { label: `${asset.symbol} daily closes`, color: "#e6a144", values: benford.map((b) => b.actual) },
            { label: "Benford expected", color: "#8ba7c9", values: benford.map((b) => b.expected) },
          ],
        },
      });
    }
    case "price-milestone-crossings":
      return one({
        kind: "milestone",
        props: {
          events: loadDistributions(asset.id).milestones,
          dates: rows.map((r) => r.date),
        },
      });
    case "days-since-percentage-decline":
      return daysSinceSpec("declines", asset);
    case "days-since-percentage-gain":
      return daysSinceSpec("gains", asset);
    case "asymmetric-quantile-regression-fan": {
      const fan = loadFan(asset.id);
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
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
          ],
        },
      });
    }
    case "risk-colorcoded":
      return one({
        kind: "risk-colored",
        props: { points: rows.map((r) => ({ date: r.date, close: r.close, risk: r.risk })) },
      });
    case "risk-time": {
      const counts = new Array(10).fill(0);
      for (const r of rows) {
        if (r.risk === null) continue;
        counts[Math.min(9, Math.floor(r.risk * 10))]++;
      }
      return one({
        kind: "category-bars",
        props: {
          categories: counts.map((_, i) => `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`),
          series: [{ label: "days", color: "#e6a144", values: counts }],
          unit: " days",
          showValues: true,
        },
      });
    }
    case "risk-levels": {
      const { riskLevels } = loadDistributions(asset.id);
      const recent = rows.filter((r) => r.date >= "2024-01-01");
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "close", color: "#e6a144", points: recent.map((r) => ({ date: r.date, value: r.close })) },
          ],
          thresholds: riskLevels.map((l) => ({
            value: l.price,
            color: riskColor(l.risk),
            label: `risk ${l.risk.toFixed(1)}`,
          })),
          showLegend: false,
        },
      });
    }
    case "short-term-bubble-risk": {
      const ta = loadTa(asset.id).rows;
      return one({
        kind: "metric",
        props: {
          points: taPoints(ta, (r) => r.bubble),
          colorByValue: true,
          height: 460,
          thresholds: [
            { value: 0.9, color: "rgba(222,107,90,0.7)", label: "frothy" },
            { value: 0.1, color: "rgba(130,181,122,0.7)", label: "washed out" },
          ],
        },
      });
    }
    case "roi-after-halving": {
      const eventRoi = loadEventRoi(asset.id);
      if (!eventRoi.halvings) {
        return note(`Not available for ${asset.symbol} — halving-cycle ROI is Bitcoin-only.`);
      }
      return one({
        kind: "days-axis",
        props: {
          log: true,
          series: multipleSeries(eventRoi.halvings),
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (break even)" }],
        },
      });
    }
    case "roi-after-cycle-bottom":
      return one({
        kind: "days-axis",
        props: {
          log: true,
          series: multipleSeries(loadEventRoi(asset.id).bottoms),
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (break even)" }],
        },
      });
    case "roi-after-cycle-peak":
      return one({
        kind: "days-axis",
        props: {
          log: true,
          series: multipleSeries(loadEventRoi(asset.id).peaks),
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (break even)" }],
        },
      });
    case "roi-after-latest-cycle-peak":
      // For every asset (BTC included) this is the asset's own single latest-peak
      // path — event-roi.json's `latestPeak` is already a one-element array per asset.
      return one({
        kind: "days-axis",
        props: {
          series: eventSeries(loadEventRoi(asset.id).latestPeak),
          thresholds: [{ value: 0, color: "rgba(162,147,130,0.5)", label: "break even" }],
        },
      });
    case "cycles-deviation":
      return one({
        kind: "days-axis",
        props: {
          series: [
            {
              label: "current cycle vs. prior-cycle average",
              color: "#e6a144",
              points: loadEventRoi(asset.id).deviation.map((p) => ({ day: p.day, value: p.pct })),
            },
          ],
          thresholds: [{ value: 0, color: "rgba(162,147,130,0.5)", label: "on trend" }],
        },
      });
    case "roi-bands": {
      const bands = loadRoiBands(asset.id);
      const dates = rows.map((r) => r.date);
      const colors = ["#82b57a", "#8ba7c9", "#e6a144", "#de6b5a"];
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: bands.map((b, i) => ({
            label: `days to ${b.multiple}×`,
            color: colors[i % colors.length],
            lineWidth: 1,
            points: dates.map((date, j) => ({ date, value: b.days[j] })),
          })),
        },
      });
    }
    case "sma-cycle-top-breakout": {
      const { smaTopBreakouts, cyclePeaks } = loadDistributions(asset.id);
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "close", color: "rgba(230,161,68,0.85)", points: rows.map((r) => ({ date: r.date, value: r.close })) },
            { label: "20W SMA", color: "#8ba7c9", lineWidth: 1, points: metricPoints(rows, (r) => r.sma20w) },
          ],
          markers: [
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
          ].sort((a, b) => a.date.localeCompare(b.date)),
        },
      });
    }
    case "best-day-to-dca": {
      const { dcaWeekday } = loadDistributions(asset.id);
      const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return one({
        kind: "category-bars",
        props: {
          categories: dcaWeekday.map((d) => DOW[d.dow]),
          series: [{ label: "avg extension above 50d SMA", color: "#e6a144", values: dcaWeekday.map((d) => d.avgExt) }],
          showValues: true,
        },
      });
    }
    case "supertrend": {
      const taAll = loadTa(asset.id).rows;
      // stUp/stDown are null until the first row with high !== low (BTC: 2017-08-17;
      // exchange-fed assets: row 0) — trim the leading all-null stretch instead of
      // hardcoding BTC's cutoff date.
      const firstIdx = taAll.findIndex((r) => r.stUp !== null || r.stDown !== null);
      const ta = firstIdx === -1 ? taAll : taAll.slice(firstIdx);
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "close", color: "rgba(230,161,68,0.85)", points: ta.map((r) => ({ date: r.date, value: r.close })) },
            { label: "uptrend stop", color: "#82b57a", lineWidth: 1, points: ta.map((r) => ({ date: r.date, value: r.stUp })) },
            { label: "downtrend stop", color: "#de6b5a", lineWidth: 1, points: ta.map((r) => ({ date: r.date, value: r.stDown })) },
          ],
        },
      });
    }
    case "stablecoin-supply": {
      const { rows: supplyRows } = loadSupply(asset.id);
      return one({
        kind: "multi-series",
        props: {
          series: [
            {
              label: `${asset.symbol} supply`,
              color: "#e6a144",
              type: "area",
              points: supplyRows.map((r) => ({ date: r.date, value: r.supply })),
            },
            {
              label: "30d change %",
              color: "#8ba7c9",
              scale: "left",
              lineWidth: 1,
              points: supplyRows.map((r) => ({ date: r.date, value: r.chg30d })),
            },
          ],
        },
      });
    }
    // ---------------------------------------------------------------- global
    case "risk-dashboard":
      return one({ kind: "asset-table", props: { assets: loadAssetsSummary().assets } });
    case "equity-risk-dashboard": {
      const assets = loadAssetsSummary().assets.filter((a) => a.class === "equity" || a.class === "index");
      const sorted = [...assets].sort(
        (a, b) => (a.class === "index" ? 0 : 1) - (b.class === "index" ? 0 : 1),
      );
      const hideMcap = sorted.length > 0 && sorted.every((a) => a.mcap === null);
      return one({ kind: "asset-table", props: { assets: sorted, hideMcap } });
    }
    case "heatmap":
      return one({ kind: "crypto-heatmap", props: { assets: loadAssetsSummary().assets } });
    case "market-capitalization-hypotheticals":
      return one({ kind: "hypotheticals", props: { assets: loadAssetsSummary().assets } });
    case "color-coded-moving-average-strength":
      return one({ kind: "ma-strength", props: { assets: loadAssetsSummary().assets } });
    case "correlation-coefficients": {
      const { ids, matrix } = loadCorrelations();
      return one({ kind: "correlation-matrix", props: { ids, matrix } });
    }
    case "cross-asset-correlations": {
      const cross = loadCrossCorrelations();
      if (!cross) return note("Cross-asset correlations have not been computed yet.");
      const pairColors = ["#e6a144", "#8ba7c9", "#82b57a", "#de6b5a"];
      const pairs = Object.entries(cross.rolling);
      const blocks: Block[] = [
        { kind: "correlation-matrix", props: { ids: cross.ids, matrix: cross.matrix } },
      ];
      if (pairs.length > 0) {
        blocks.push({
          kind: "multi-series",
          props: {
            series: pairs.map(([pair, points], i) => ({
              label: pair.split("-").map((s) => s.toUpperCase()).join("–"),
              color: pairColors[i % pairColors.length],
              points,
            })),
            thresholds: [{ value: 0, color: "rgba(162,147,130,0.5)", label: "uncorrelated" }],
          },
        });
      }
      return { blocks };
    }
    case "crypto-vs-equities": {
      const cross = loadCrossAsset();
      if (!cross) return note("Cross-asset comparison has not been computed yet.");
      const colors = ["#e6a144", "#8ba7c9", "#82b57a", "#de6b5a", "#b391bf", "#7fb5a8", "#c07a4a"];
      const seriesFor = (baseRows: ({ date: string } & Record<string, number | null>)[]): SeriesDef[] => {
        const ids = Object.keys(baseRows[0] ?? {}).filter((k) => k !== "date");
        return ids.map((id, i) => ({
          label: id.toUpperCase(),
          color: colors[i % colors.length],
          points: baseRows.map((r) => ({ date: r.date, value: r[id] ?? null })),
        }));
      };
      const baseDates = Object.keys(cross.bases).sort();
      const blocks: Block[] = [];
      for (const base of baseDates) {
        blocks.push({ kind: "heading", props: { text: `rebased to 100 at ${base}` } });
        blocks.push({
          kind: "multi-series",
          props: {
            rightLog: true,
            series: seriesFor(cross.bases[base].rows),
            thresholds: [{ value: 100, color: "rgba(162,147,130,0.5)", label: "start" }],
          },
        });
      }
      return { blocks };
    }
    case "portfolios-weighted-by-market-cap": {
      const pf = loadPortfolios().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "top 5 (mcap-weighted)", color: "#e6a144", points: pf.map((r) => ({ date: r.date, value: r.top5 })) },
            { label: "top 10", color: "#8ba7c9", points: pf.map((r) => ({ date: r.date, value: r.top10 })) },
            { label: "top 20", color: "#b391bf", points: pf.map((r) => ({ date: r.date, value: r.top20 })) },
            { label: "BTC only", color: "#82b57a", points: pf.map((r) => ({ date: r.date, value: r.btc })) },
          ],
          thresholds: [{ value: 100, color: "rgba(162,147,130,0.5)", label: "start (2019)" }],
        },
      });
    }
    case "advance-decline-ratios": {
      const b = loadBreadth().rows;
      return one({
        kind: "metric",
        props: {
          points: b.flatMap((r) => (r.advPct === null ? [] : [{ date: r.date, value: r.advPct }])),
          height: 460,
          thresholds: [{ value: 50, color: "rgba(162,147,130,0.5)", label: "even" }],
        },
      });
    }
    case "advance-decline-index": {
      const b = loadBreadth().rows;
      return one({
        kind: "metric",
        props: { points: b.map((r) => ({ date: r.date, value: r.adi })), color: "#8ba7c9", height: 460 },
      });
    }
    case "absolute-breadth-index": {
      const b = loadBreadth().rows;
      return one({
        kind: "multi-series",
        props: {
          series: [{ label: "|advances − declines|", color: "#b391bf", type: "histogram", points: b.map((r) => ({ date: r.date, value: r.abi })) }],
        },
      });
    }
    case "above-below-ma": {
      const b = loadBreadth().rows;
      return one({
        kind: "metric",
        props: {
          points: b.flatMap((r) => (r.above20wPct === null ? [] : [{ date: r.date, value: r.above20wPct }])),
          colorByValue: true,
          height: 460,
          thresholds: [
            { value: 80, color: "rgba(222,107,90,0.7)", label: "broad bull" },
            { value: 20, color: "rgba(130,181,122,0.7)", label: "washout" },
          ],
        },
      });
    }
    case "alts-vs-btc": {
      const anchor = "2024-07-01";
      const btcSeries = loadMetrics().rows.filter((r) => r.date >= anchor);
      const btcMap = new Map(btcSeries.map((r) => [r.date, r.close]));
      const btcBase = btcSeries[0].close;
      const majors = ["eth", "sol", "bnb", "xrp", "ada", "doge", "link", "avax"];
      const summary = loadAssetsSummary().assets.filter((a) => a.id !== "btc" && !a.stale);
      return one({
        kind: "days-axis",
        props: {
          log: true,
          series: summary.map((a, i) => {
            const assetRows = loadAssetDaily(a.id).rows.filter((r) => r.date >= anchor);
            const base = assetRows[0];
            const baseRatio = base ? base.close / (btcMap.get(base.date) ?? btcBase) : 1;
            return {
              label: a.symbol,
              color: ASSET_PALETTE[i % ASSET_PALETTE.length],
              points: assetRows.flatMap((r, day) => {
                const b = btcMap.get(r.date);
                return b ? [{ day, value: Number((r.close / b / baseRatio).toFixed(4)) }] : [];
              }),
            };
          }),
          defaultHidden: summary.filter((a) => !majors.includes(a.id)).map((a) => a.symbol),
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "vs BTC breakeven" }],
        },
      });
    }
    case "roi-after-bottom-comparison":
      return comparisonSpec(loadComparisons().fromBottom, ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-cycle-bottom-for-crypto-pairs":
      return comparisonSpec(loadComparisons().pairsFromBottom, ["ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-inception-comparison":
      return comparisonSpec(loadComparisons().inception, ["BTC", "ETH", "SOL", "DOGE", "LINK"]);
    case "roi-after-inception-for-crypto-pairs":
      return comparisonSpec(loadComparisons().pairsInception, ["ETH", "SOL", "DOGE", "LINK"]);
    case "roi-after-latest-cycle-peak-for-crypto-pairs":
      return comparisonSpec(loadComparisons().pairsFromPeak, ["ETH", "SOL", "BNB", "XRP", "DOGE"]);
    case "roi-after-sub-cycle-bottom":
      return one({
        kind: "days-axis",
        props: {
          log: true,
          series: loadComparisons().ethSubCycle.map((l, i) => ({
            label: l.id,
            color: ASSET_PALETTE[i % ASSET_PALETTE.length],
            points: l.points.map((p) => ({ day: p.day, value: p.mult })),
          })),
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "1× (bottom)" }],
        },
      });
    case "mvrv": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "metric",
        props: {
          points: onchainPoints(oc, (r) => r.mvrv, "2011-01-01"),
          height: 460,
          thresholds: [
            { value: 3.5, color: "rgba(222,107,90,0.7)", label: "euphoria" },
            { value: 1, color: "rgba(130,181,122,0.7)", label: "cost basis" },
          ],
        },
      });
    }
    case "mvrv-z-score": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "metric",
        props: {
          points: onchainPoints(oc, (r) => r.mvrvZ, "2011-01-01"),
          color: "#8ba7c9",
          height: 460,
          thresholds: [
            { value: 7, color: "rgba(222,107,90,0.7)", label: "top zone" },
            { value: 0.1, color: "rgba(130,181,122,0.7)", label: "deep value" },
          ],
        },
      });
    }
    case "nupl": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "metric",
        props: {
          points: onchainPoints(oc, (r) => r.nupl, "2011-01-01"),
          colorByValue: true,
          height: 460,
          thresholds: [
            { value: 0.75, color: "rgba(222,107,90,0.7)", label: "euphoria" },
            { value: 0, color: "rgba(130,181,122,0.7)", label: "capitulation" },
          ],
        },
      });
    }
    case "puell-multiple": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "metric",
        props: {
          points: onchainPoints(oc, (r) => r.puell, "2011-01-01"),
          height: 460,
          thresholds: [
            { value: 4, color: "rgba(222,107,90,0.7)", label: "miner euphoria" },
            { value: 0.5, color: "rgba(130,181,122,0.7)", label: "miner stress" },
          ],
        },
      });
    }
    case "stock-to-flow": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          leftLog: true,
          series: [
            { label: "stock-to-flow", color: "#e6a144", points: onchainPoints(oc, (r) => r.s2f, "2011-01-01") },
            { label: "price (left)", color: "rgba(162,147,130,0.5)", scale: "left", lineWidth: 1, points: onchainPoints(oc, (r) => r.price, "2011-01-01") },
          ],
        },
      });
    }
    case "issuance": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "issuance $/day (log, right)", color: "#e6a144", points: onchainPoints(oc, (r) => r.issUsd, "2010-10-01") },
            { label: "annual inflation % (left)", color: "#8ba7c9", scale: "left", lineWidth: 1, points: onchainPoints(oc, (r) => r.inflPct, "2010-10-01") },
          ],
        },
      });
    }
    case "supply-eth-btc": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "BTC supply", color: "#e6a144", points: onchainPoints(btc, (r) => r.splyCur) },
            { label: "ETH supply", color: "#8ba7c9", points: onchainPoints(eth, (r) => r.splyCur) },
          ],
        },
      });
    }
    case "address-activity": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "BTC active addresses", color: "#e6a144", points: onchainPoints(btc, (r) => r.adrAct, "2011-01-01") },
            { label: "ETH active addresses", color: "#8ba7c9", points: onchainPoints(eth, (r) => r.adrAct) },
          ],
        },
      });
    }
    case "transfer-count-statistics": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "transactions/day", color: "#e6a144", points: onchainPoints(oc, (r) => r.txCnt, "2011-01-01") },
            { label: "value transfers/day", color: "#8ba7c9", lineWidth: 1, points: onchainPoints(oc, (r) => r.txTfrCnt, "2011-01-01") },
          ],
        },
      });
    }
    case "transaction-fees": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "BTC fees $/day", color: "#e6a144", points: onchainPoints(btc, (r) => r.feesUsd, "2011-01-01") },
            { label: "ETH fees $/day", color: "#8ba7c9", points: onchainPoints(eth, (r) => r.feesUsd) },
          ],
        },
      });
    }
    case "hash-rate": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [{ label: "hash rate (TH/s)", color: "#e6a144", points: onchainPoints(oc, (r) => r.hashRate, "2010-01-01") }],
        },
      });
    }
    case "hash-ribbons": {
      const { rows: oc, ribbonEvents } = loadOnchainBtc();
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "hash rate 30d MA", color: "#82b57a", points: onchainPoints(oc, (r) => r.hashSma30, "2011-01-01") },
            { label: "hash rate 60d MA", color: "#de6b5a", points: onchainPoints(oc, (r) => r.hashSma60, "2011-01-01") },
            { label: "hash rate", color: "rgba(162,147,130,0.35)", lineWidth: 1, points: onchainPoints(oc, (r) => r.hashRate, "2011-01-01") },
          ],
          markers: ribbonEvents
            .filter((e) => e.date >= "2011-01-01")
            .map((e) => ({
              date: e.date,
              position: e.type === "up" ? ("belowBar" as const) : ("aboveBar" as const),
              color: e.type === "up" ? "#82b57a" : "#de6b5a",
              shape: e.type === "up" ? ("arrowUp" as const) : ("arrowDown" as const),
            })),
        },
      });
    }
    case "hash-over-price": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [{ label: "hash rate / price", color: "#b391bf", points: onchainPoints(oc, (r) => r.hashOverPrice, "2011-01-01") }],
        },
      });
    }
    case "miner-revenue": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [{ label: "miner revenue $/day", color: "#e6a144", points: onchainPoints(oc, (r) => r.minerRev) }],
        },
      });
    }
    case "mcap-thermocap": {
      const oc = loadOnchainBtc().rows;
      return one({ kind: "metric", props: { points: onchainPoints(oc, (r) => r.mctc, "2011-01-01"), height: 460 } });
    }
    case "rcap-thermocap": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "metric",
        props: { points: onchainPoints(oc, (r) => r.rctc, "2011-01-01"), color: "#8ba7c9", height: 460 },
      });
    }
    case "block": {
      const oc = loadOnchainBtc().rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "blocks/day", color: "#e6a144", lineWidth: 1, points: onchainPoints(oc, (r) => r.blkCnt, "2011-01-01") },
            { label: "avg block size MB (left)", color: "#8ba7c9", scale: "left", points: onchainPoints(oc, (r) => r.blockSizeMb, "2011-01-01") },
          ],
        },
      });
    }
    case "exchange-supply": {
      const btc = loadOnchainBtc().rows;
      const eth = loadOnchainEth().rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "BTC on exchanges", color: "#e6a144", points: onchainPoints(btc, (r) => r.splyExNtv, "2012-01-01") },
            { label: "ETH on exchanges (left)", color: "#8ba7c9", scale: "left", points: onchainPoints(eth, (r) => r.splyExNtv) },
          ],
        },
      });
    }
    case "exchange-flow": {
      const oc = loadOnchainBtc().rows.filter((r) => r.date >= "2013-01-01");
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "net flow $/day", color: "rgba(162,147,130,0.6)", type: "histogram", points: oc.map((r) => ({ date: r.date, value: r.flowNetExUsd })) },
            { label: "inflow $/day", color: "#de6b5a", lineWidth: 1, points: oc.map((r) => ({ date: r.date, value: r.flowInExUsd })) },
            { label: "outflow $/day", color: "#82b57a", lineWidth: 1, points: oc.map((r) => ({ date: r.date, value: r.flowOutExUsd })) },
          ],
        },
      });
    }
    case "futures-open-interest":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "BTC futures OI $", color: "#e6a144", points: loadDerivs<{ oiUsd: number }>("futures-oi-btc").rows.map((r) => ({ date: r.date, value: r.oiUsd })) },
            { label: "ETH futures OI $ (left)", color: "#8ba7c9", scale: "left", points: loadDerivs<{ oiUsd: number }>("futures-oi-eth").rows.map((r) => ({ date: r.date, value: r.oiUsd })) },
          ],
        },
      });
    case "options-open-interest":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "BTC options OI $ (Deribit)", color: "#e6a144", points: loadDerivs<{ oiUsd: number }>("options-oi-btc").rows.map((r) => ({ date: r.date, value: r.oiUsd })) },
            { label: "ETH options OI $ (left)", color: "#8ba7c9", scale: "left", points: loadDerivs<{ oiUsd: number }>("options-oi-eth").rows.map((r) => ({ date: r.date, value: r.oiUsd })) },
          ],
        },
      });
    case "long-short-ratios": {
      const ls = loadDerivs<{ topAcct?: number; topPos?: number; global?: number }>("long-short-btc").rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "top accounts", color: "#e6a144", points: ls.map((r) => ({ date: r.date, value: r.topAcct ?? null })) },
            { label: "top positions", color: "#8ba7c9", points: ls.map((r) => ({ date: r.date, value: r.topPos ?? null })) },
            { label: "all accounts", color: "#b391bf", points: ls.map((r) => ({ date: r.date, value: r.global ?? null })) },
          ],
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "balanced" }],
        },
      });
    }
    case "long-short-percent": {
      const ls = loadDerivs<{ longPct?: number; shortPct?: number }>("long-short-btc").rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "top traders long %", color: "#82b57a", points: ls.map((r) => ({ date: r.date, value: r.longPct ?? null })) },
            { label: "top traders short %", color: "#de6b5a", points: ls.map((r) => ({ date: r.date, value: r.shortPct ?? null })) },
          ],
          thresholds: [{ value: 50, color: "rgba(162,147,130,0.5)", label: "even" }],
        },
      });
    }
    case "wikipedia-page-views": {
      const articles = ["bitcoin", "ethereum", "cryptocurrency", "blockchain"];
      const colors = ["#e6a144", "#8ba7c9", "#82b57a", "#b391bf"];
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: articles.map((a, i) => ({
            label: a,
            color: colors[i],
            lineWidth: 1,
            points: loadWiki(a).rows.map((r) => ({ date: r.date, value: r.views })),
          })),
        },
      });
    }
    case "dominance": {
      const agg = loadMcapAggregates().rows;
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "BTC dominance %", color: "#e6a144", points: agg.map((r) => ({ date: r.date, value: r.btcDom })) },
            { label: "ETH dominance %", color: "#8ba7c9", points: agg.map((r) => ({ date: r.date, value: r.ethDom })) },
          ],
        },
      });
    }
    case "market-cap-logarithmic-regression": {
      const agg = loadMcapAggregates().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "total mcap $B", color: "#e6a144", points: agg.map((r) => ({ date: r.date, value: r.total })) },
            { label: "median fit", color: "#c9bba6", dashed: true, lineWidth: 1, points: agg.map((r) => ({ date: r.date, value: r.fair })) },
            { label: "τ 0.15", color: "rgba(130,181,122,0.6)", lineWidth: 1, points: agg.map((r) => ({ date: r.date, value: r.fairLow })) },
            { label: "τ 0.85", color: "rgba(222,107,90,0.6)", lineWidth: 1, points: agg.map((r) => ({ date: r.date, value: r.fairHigh })) },
          ],
        },
      });
    }
    case "market-cap-vs-fair-value": {
      const agg = loadMcapAggregates().rows;
      return one({
        kind: "metric",
        props: {
          points: agg.map((r) => ({ date: r.date, value: Number((r.total / r.fair).toFixed(3)) })),
          height: 460,
          thresholds: [{ value: 1, color: "rgba(162,147,130,0.5)", label: "on trend" }],
        },
      });
    }
    case "altcoin-market-capitalizations": {
      const agg = loadMcapAggregates().rows;
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "total − BTC ($B)", color: "#8ba7c9", points: agg.map((r) => ({ date: r.date, value: r.alt })) },
            { label: "total − BTC/ETH/stables ($B)", color: "#b391bf", points: agg.map((r) => ({ date: r.date, value: r.altExEthStables })) },
          ],
        },
      });
    }
    case "ssr": {
      const agg = loadMcapAggregates().rows.filter((r) => r.ssr !== null && r.date >= "2017-01-01");
      return one({
        kind: "metric",
        props: { points: agg.map((r) => ({ date: r.date, value: r.ssr! })), color: "#8ba7c9", height: 460 },
      });
    }
    case "altcoin-season-index":
      return one({
        kind: "metric",
        props: {
          points: loadAltseason().rows.map((r) => ({ date: r.date, value: r.value })),
          height: 460,
          thresholds: [
            { value: 75, color: "rgba(130,181,122,0.7)", label: "altcoin season" },
            { value: 25, color: "rgba(222,107,90,0.7)", label: "bitcoin season" },
          ],
        },
      });
    case "inflation-yoy":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "CPI YoY %", color: "#e6a144", points: yoy(loadFred("cpi").rows.filter((r) => r.date >= "1959-01-01")) },
            { label: "core CPI YoY %", color: "#8ba7c9", points: yoy(loadFred("core-cpi").rows.filter((r) => r.date >= "1959-01-01")) },
          ],
          thresholds: [{ value: 2, color: "rgba(130,181,122,0.6)", label: "Fed target" }],
        },
      });
    case "money-supply":
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "M2 ($B)", color: "#e6a144", points: loadFred("m2").rows },
            { label: "M1 ($B)", color: "#8ba7c9", points: loadFred("m1").rows },
          ],
        },
      });
    case "fed-liquidity":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "Fed total assets $B", color: "#e6a144", points: loadFedAssets().rows.filter((r) => r.date >= "2014-01-01") },
            { label: "ON RRP $B (left)", color: "#8ba7c9", scale: "left", points: loadFred("on-rrp").rows.filter((r) => r.date >= "2014-01-01") },
          ],
        },
      });
    case "yield-curves":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "10y − 2y", color: "#e6a144", points: loadFred("t10y2y").rows },
            { label: "10y − 3m", color: "#8ba7c9", lineWidth: 1, points: loadFred("t10y3m").rows },
          ],
          thresholds: [{ value: 0, color: "rgba(222,107,90,0.6)", label: "inversion" }],
        },
      });
    case "fed-funds-rate":
      return one({
        kind: "multi-series",
        props: {
          series: [{ label: "fed funds effective rate %", color: "#e6a144", points: loadFred("ffr").rows }],
          showLegend: false,
        },
      });
    case "employment":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "unemployment % (left)", color: "#de6b5a", scale: "left", points: loadFred("unrate").rows },
            { label: "nonfarm payrolls (thousands)", color: "#82b57a", points: loadFred("payems").rows },
          ],
        },
      });
    case "gdp-and-debt":
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "GDP $B (log)", color: "#e6a144", points: loadFred("gdp").rows },
            { label: "debt-to-GDP % (left)", color: "#de6b5a", scale: "left", points: loadFred("debt-to-gdp").rows },
          ],
        },
      });
    case "personal-income":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "real income ex transfers $B", color: "#e6a144", points: loadFred("real-income").rows },
            { label: "saving rate % (left)", color: "#8ba7c9", scale: "left", points: loadFred("saving-rate").rows },
          ],
        },
      });
    case "consumer-sentiment":
      return one({
        kind: "multi-series",
        props: {
          series: [{ label: "UMich consumer sentiment", color: "#b391bf", points: loadFred("sentiment").rows }],
          showLegend: false,
        },
      });
    case "housing":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "housing starts (thousands)", color: "#e6a144", points: loadFred("housing-starts").rows },
            { label: "new home sales (thousands)", color: "#8ba7c9", points: loadFred("new-home-sales").rows },
          ],
        },
      });
    case "home-prices-and-mortgages":
      return one({
        kind: "multi-series",
        props: {
          series: [
            { label: "Case-Shiller index (left)", color: "#e6a144", scale: "left", points: loadFred("case-shiller").rows },
            { label: "30y mortgage rate %", color: "#de6b5a", points: loadFred("mortgage-30y").rows.filter((r) => r.date >= "1987-01-01") },
          ],
        },
      });
    case "bank-loans":
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "real-estate loans $B", color: "#e6a144", points: loadFred("real-estate-loans").rows.filter((r) => r.date >= "1960-01-01") },
            { label: "business loans $B", color: "#8ba7c9", points: loadFred("business-loans").rows.filter((r) => r.date >= "1960-01-01") },
            { label: "consumer loans $B", color: "#82b57a", points: loadFred("consumer-loans").rows },
          ],
        },
      });
    case "nfci":
      return one({
        kind: "multi-series",
        props: {
          series: [{ label: "NFCI", color: "#b391bf", points: loadFred("nfci").rows }],
          thresholds: [{ value: 0, color: "rgba(162,147,130,0.5)", label: "long-run average" }],
          showLegend: false,
        },
      });
    case "qt-ending-bear-markets": {
      const fed = loadFedAssets().rows.filter((r) => r.date >= "2014-01-01");
      const QT = [
        { date: "2017-10-04", type: "start" as const, label: "QT1 starts" },
        { date: "2019-08-01", type: "end" as const, label: "QT1 ends" },
        { date: "2022-06-01", type: "start" as const, label: "QT2 starts" },
        { date: "2025-12-31", type: "end" as const, label: "QT2 ends" },
      ];
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "BTC/USD (log, right)", color: "#e6a144", points: loadMetrics().rows.filter((r) => r.date >= "2014-01-01").map((r) => ({ date: r.date, value: r.close })) },
            { label: "Fed total assets, $B (left)", color: "#8ba7c9", scale: "left", lineWidth: 1, points: fed.map((r) => ({ date: r.date, value: r.value })) },
          ],
          markers: QT.map((q) => ({
            date: q.date,
            position: q.type === "start" ? ("aboveBar" as const) : ("belowBar" as const),
            color: q.type === "start" ? "#de6b5a" : "#82b57a",
            shape: q.type === "start" ? ("arrowDown" as const) : ("arrowUp" as const),
            text: q.label,
          })),
        },
      });
    }
    case "btc-vs-dxy": {
      const btcRows = loadMetrics().rows;
      const dxyRows = loadDxy().rows.filter((r) => r.date >= "2010-08-18");
      return one({
        kind: "multi-series",
        props: {
          rightLog: true,
          series: [
            { label: "BTC/USD (log, right)", color: "#e6a144", points: btcRows.map((r) => ({ date: r.date, value: r.close })) },
            { label: "DXY (left)", color: "#8ba7c9", scale: "left", lineWidth: 1, points: dxyRows.map((r) => ({ date: r.date, value: r.close })) },
          ],
        },
      });
    }
    case "fear-greed-index": {
      const btcRows = loadMetrics().rows;
      const fng = new Map(loadFearGreed().rows.map((r) => [r.date, r.value]));
      return one({
        kind: "risk-colored",
        props: {
          points: btcRows.map((r) => {
            const v = fng.get(r.date);
            // riskColor is green→red over 0..1, so invert: greed green, fear red
            return { date: r.date, close: r.close, risk: v === undefined ? null : 1 - v / 100 };
          }),
          legendText: "extreme greed → extreme fear",
        },
      });
    }
    default:
      return null;
  }
}
