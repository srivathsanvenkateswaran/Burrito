"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
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

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [events, dates]);

  return (
    <div className="rounded-xl border border-line bg-surface/50 p-3 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div ref={containerRef} className="h-[460px] w-full" />
    </div>
  );
}
