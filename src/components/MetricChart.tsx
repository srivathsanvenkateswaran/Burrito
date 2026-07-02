"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";

export interface MetricPoint {
  date: string;
  value: number;
}

interface Props {
  points: MetricPoint[];
  color?: string;
  /** Per-point bar coloring (e.g. risk gradient); renders a histogram. */
  colorByValue?: boolean;
  thresholds?: { value: number; color: string; label: string }[];
  height?: number;
}

/** salsa → queso → chile across 0..1 */
export function riskColor(v: number): string {
  const stops: [number, number[]][] = [
    [0, [130, 181, 122]],
    [0.5, [230, 161, 68]],
    [1, [222, 107, 90]],
  ];
  const upper = stops.findIndex(([s]) => v <= s);
  if (upper <= 0) return `rgb(${stops[upper === 0 ? 0 : stops.length - 1][1].join(",")})`;
  const [s0, c0] = stops[upper - 1];
  const [s1, c1] = stops[upper];
  const t = (v - s0) / (s1 - s0);
  const mix = c0.map((c, i) => Math.round(c + (c1[i] - c) * t));
  return `rgb(${mix.join(",")})`;
}

export default function MetricChart({
  points,
  color = "#e6a144",
  colorByValue = false,
  thresholds = [],
  height = 220,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a29382",
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(237, 227, 212, 0.05)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, minBarSpacing: 0.001 },
    });

    const data = points.map((p) => ({
      time: (Date.parse(`${p.date}T00:00:00Z`) / 1000) as UTCTimestamp,
      value: p.value,
      ...(colorByValue ? { color: riskColor(p.value) } : {}),
    }));

    const series = colorByValue
      ? chart.addSeries(HistogramSeries, { priceLineVisible: false, base: 0 })
      : chart.addSeries(LineSeries, {
          color,
          lineWidth: 2,
          priceLineVisible: false,
        });
    series.setData(data);

    for (const t of thresholds) {
      series.createPriceLine({
        price: t.value,
        color: t.color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: t.label,
      });
    }

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [points, color, colorByValue, thresholds]);

  return (
    <div className="rounded-xl border border-line bg-surface/50 p-3 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
}
