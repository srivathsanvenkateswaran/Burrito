"use client";

import { useEffect, useRef } from "react";
import { useChartColors } from "./ThemeProvider";
import { DateRangeBar, ExpandButton } from "./ChartControls";
import {
  ColorType,
  createChart,
  type IChartApi,
  LineSeries,
  PriceScaleMode,
  type UTCTimestamp,
} from "lightweight-charts";

export interface MilestoneEvent {
  date: string;
  level: number;
}

/** blue → violet → red across milestone rank */
function levelColor(idx: number, count: number): string {
  const t = count <= 1 ? 0 : idx / (count - 1);
  const from = [90, 130, 235];
  const to = [222, 80, 90];
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${mix.join(",")})`;
}

export default function MilestoneChart({
  events,
  dates,
}: {
  events: MilestoneEvent[];
  /** full daily date range; keeps the time axis linear despite sparse events */
  dates: string[];
}) {
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
      rightPriceScale: { borderVisible: false, mode: PriceScaleMode.Logarithmic },
      timeScale: { borderVisible: false, minBarSpacing: 0.001 },
    });

    const levels = [...new Set(events.map((e) => e.level))].sort((a, b) => a - b);

    // invisible daily series so the time axis stays uniform between sparse events
    const spine = chart.addSeries(LineSeries, {
      color: "transparent",
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    spine.setData(
      dates.map((d) => ({
        time: (Date.parse(`${d}T00:00:00Z`) / 1000) as UTCTimestamp,
        value: levels[0] ?? 1,
      })),
    );

    levels.forEach((level, idx) => {
      const s = chart.addSeries(LineSeries, {
        color: levelColor(idx, levels.length),
        lineVisible: false,
        pointMarkersVisible: true,
        pointMarkersRadius: 3,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(
        events
          .filter((e) => e.level === level)
          .map((e) => ({
            time: (Date.parse(`${e.date}T00:00:00Z`) / 1000) as UTCTimestamp,
            value: level,
          })),
      );
    });

    chartRef.current = chart;
    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
      chartRef.current = null;
    };
  }, [events, dates, cc]);

  return (
    <div
      data-chart-card
      className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-line/70 px-4 py-2">
        <DateRangeBar
          min={dates[0] ?? ""}
          max={dates.at(-1) ?? ""}
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
        <div ref={containerRef} className="chart-host h-[460px] w-full" />
      </div>
    </div>
  );
}
