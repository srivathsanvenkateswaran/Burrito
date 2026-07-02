"use client";

import { useEffect, useRef, useState } from "react";
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

const OVERLAYS: { key: OverlayKey; label: string; dots: string[] }[] = [
  { key: "regression", label: "log regression", dots: ["#d4d4d8"] },
  { key: "bmsb", label: "BMSB 20w/21w", dots: ["#22c55e", "#ef4444"] },
  { key: "sma50w", label: "50W SMA", dots: ["#3b82f6"] },
  { key: "sma200w", label: "200W SMA", dots: ["#a855f7"] },
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
        textColor: "#8b8b96",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(139, 139, 150, 0.08)" },
        horzLines: { color: "rgba(139, 139, 150, 0.08)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, minBarSpacing: 0.001 },
      crosshair: {
        horzLine: { labelBackgroundColor: "#e8590c" },
        vertLine: { labelBackgroundColor: "#e8590c" },
      },
    });
    chartRef.current = chart;

    const price = chart.addSeries(AreaSeries, {
      lineColor: "#e8590c",
      lineWidth: 2,
      topColor: "rgba(232, 89, 12, 0.25)",
      bottomColor: "rgba(232, 89, 12, 0.0)",
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
    addLine("regression", (r) => r.fair, "#d4d4d8", LineStyle.Dashed);
    addLine("regression", (r) => r.bandLow, "rgba(212, 212, 216, 0.35)");
    addLine("regression", (r) => r.bandHigh, "rgba(212, 212, 216, 0.35)");
    addLine("bmsb", (r) => r.sma20w, "#22c55e");
    addLine("bmsb", (r) => r.ema21w, "#ef4444");
    addLine("sma50w", (r) => r.sma50w, "#3b82f6");
    addLine("sma200w", (r) => r.sma200w, "#a855f7");

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
      chartRef.current = null;
    };
  }, [rows]);

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
    `rounded px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-neutral-100 text-neutral-900"
        : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
    }`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex gap-0.5 rounded-md bg-neutral-900 p-0.5">
          {RANGES.map((r) => (
            <button key={r} className={btn(range === r)} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-md bg-neutral-900 p-0.5">
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
                  ? "border-neutral-600 text-neutral-200"
                  : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
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
      <div ref={containerRef} className="h-[60vh] min-h-[380px] w-full" />
    </div>
  );
}
