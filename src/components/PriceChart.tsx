"use client";

import { useEffect, useRef, useState } from "react";
import { useChartColors } from "./ThemeProvider";
import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type UTCTimestamp,
} from "lightweight-charts";

export interface MetricRow {
  date: string;
  close: number;
  fair: number | null;
  bandLow: number | null;
  bandHigh: number | null;
  sma20w: number | null;
  ema21w: number | null;
  sma50w: number | null;
  sma200w: number | null;
}

type OverlayKey = "regression" | "bmsb" | "sma50w" | "sma200w";

const RANGES = ["1Y", "2Y", "4Y", "8Y", "ALL"] as const;
type Range = (typeof RANGES)[number];

const C = {
  text: "#a29382",
  grid: "rgba(237, 227, 212, 0.05)",
  accent: "#e6a144",
  accentFillTop: "rgba(230, 161, 68, 0.18)",
  regression: "#c9bba6",
  regressionBand: "rgba(201, 187, 166, 0.32)",
  gain: "#82b57a",
  loss: "#de6b5a",
  sma50w: "#8ba7c9",
  sma200w: "#b391bf",
};

const OVERLAYS: { key: OverlayKey; label: string; dots: string[] }[] = [
  { key: "regression", label: "log regression", dots: [C.regression] },
  { key: "bmsb", label: "BMSB 20w/21w", dots: [C.gain, C.loss] },
  { key: "sma50w", label: "50W SMA", dots: [C.sma50w] },
  { key: "sma200w", label: "200W SMA", dots: [C.sma200w] },
];

function ts(date: string): UTCTimestamp {
  return (Date.parse(`${date}T00:00:00Z`) / 1000) as UTCTimestamp;
}

function lineData(rows: MetricRow[], pick: (r: MetricRow) => number | null) {
  return rows.flatMap((r) => {
    const v = pick(r);
    return v === null ? [] : [{ time: ts(r.date), value: v }];
  });
}

export default function PriceChart({ rows }: { rows: MetricRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cc = useChartColors();
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Partial<Record<OverlayKey, ISeriesApi<"Line">[]>>>({});

  const [scale, setScale] = useState<"log" | "linear">("log");
  const [range, setRange] = useState<Range>("ALL");
  const [overlays, setOverlays] = useState<Record<OverlayKey, boolean>>({
    regression: true,
    bmsb: true,
    sma50w: false,
    sma200w: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: cc.text,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: cc.grid },
        horzLines: { color: cc.grid },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, minBarSpacing: 0.001 },
      crosshair: {
        horzLine: { labelBackgroundColor: cc.crosshair },
        vertLine: { labelBackgroundColor: cc.crosshair },
      },
    });
    chartRef.current = chart;

    const price = chart.addSeries(AreaSeries, {
      lineColor: C.accent,
      lineWidth: 2,
      topColor: C.accentFillTop,
      bottomColor: "rgba(230, 161, 68, 0.0)",
      priceLineVisible: false,
    });
    price.setData(lineData(rows, (r) => r.close));

    const addLine = (
      key: OverlayKey,
      pick: (r: MetricRow) => number | null,
      color: string,
      style: LineStyle = LineStyle.Solid,
    ) => {
      const s = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        lineStyle: style,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      s.setData(lineData(rows, pick));
      (seriesRef.current[key] ??= []).push(s);
    };

    seriesRef.current = {};
    addLine("regression", (r) => r.fair, C.regression, LineStyle.Dashed);
    addLine("regression", (r) => r.bandLow, C.regressionBand);
    addLine("regression", (r) => r.bandHigh, C.regressionBand);
    addLine("bmsb", (r) => r.sma20w, C.gain);
    addLine("bmsb", (r) => r.ema21w, C.loss);
    addLine("sma50w", (r) => r.sma50w, C.sma50w);
    addLine("sma200w", (r) => r.sma200w, C.sma200w);

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
      chartRef.current = null;
    };
  }, [rows, cc]);

  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions({
      mode: scale === "log" ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
    });
  }, [scale]);

  useEffect(() => {
    for (const { key } of OVERLAYS) {
      for (const s of seriesRef.current[key] ?? []) {
        s.applyOptions({ visible: overlays[key] });
      }
    }
  }, [overlays]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || rows.length === 0) return;
    if (range === "ALL") {
      chart.timeScale().fitContent();
      return;
    }
    const to = ts(rows.at(-1)!.date);
    const from = (to - Number(range[0]) * 365 * 86_400) as UTCTimestamp;
    chart.timeScale().setVisibleRange({ from, to });
  }, [range, rows]);

  const btn = (active: boolean) =>
    `rounded px-2.5 py-1 font-mono text-xs transition-colors ${
      active ? "bg-fg text-ink" : "text-muted hover:bg-raise hover:text-fg"
    }`;

  return (
    <div className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div className="flex flex-wrap items-center gap-4 border-b border-line/70 px-4 py-3">
        <div className="flex gap-0.5 rounded-md bg-ink p-0.5">
          {RANGES.map((r) => (
            <button key={r} className={btn(range === r)} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-md bg-ink p-0.5">
          {(["log", "linear"] as const).map((s) => (
            <button key={s} className={btn(scale === s)} onClick={() => setScale(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OVERLAYS.map(({ key, label, dots }) => (
            <button
              key={key}
              onClick={() => setOverlays((o) => ({ ...o, [key]: !o[key] }))}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                overlays[key]
                  ? "border-faint/60 text-fg"
                  : "border-line text-faint hover:border-faint/60"
              }`}
            >
              {dots.map((d) => (
                <span
                  key={d}
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: d, opacity: overlays[key] ? 1 : 0.35 }}
                />
              ))}
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        <div ref={containerRef} className="h-[58vh] min-h-[380px] w-full" />
      </div>
    </div>
  );
}
