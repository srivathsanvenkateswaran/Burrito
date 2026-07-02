"use client";

import { useEffect, useRef } from "react";
import { useChartColors } from "./ThemeProvider";
import { DateRangeBar, ExpandButton } from "./ChartControls";
import {
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import { riskColor } from "@/lib/colors";

export { riskColor };

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

export default function MetricChart({
  points,
  color = "#e6a144",
  colorByValue = false,
  thresholds = [],
  height = 220,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const cc = useChartColors();

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
        vertLines: { visible: false },
        horzLines: { color: cc.grid },
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

    chartRef.current = chart;
    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
      chartRef.current = null;
    };
  }, [points, color, colorByValue, thresholds, cc]);

  return (
    <div
      data-chart-card
      className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-line/70 px-4 py-2">
        <DateRangeBar
          min={points[0]?.date ?? ""}
          max={points.at(-1)?.date ?? ""}
          onApply={(from, to) =>
            chartRef.current?.timeScale().setVisibleRange({
              from: (Date.parse(`${from}T00:00:00Z`) / 1000) as UTCTimestamp,
              to: (Date.parse(`${to}T00:00:00Z`) / 1000) as UTCTimestamp,
            })
          }
          onReset={() => chartRef.current?.timeScale().fitContent()}
        />
        <ExpandButton />
      </div>
      <div className="p-3">
        <div ref={containerRef} style={{ height }} className="chart-host w-full" />
      </div>
    </div>
  );
}
