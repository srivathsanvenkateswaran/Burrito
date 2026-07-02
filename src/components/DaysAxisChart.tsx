"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColorType,
  createChart,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type UTCTimestamp,
} from "lightweight-charts";

export interface DaySeries {
  label: string;
  color: string;
  lineWidth?: number;
  points: { day: number; value: number }[];
}

/** Fake epoch so a "days since event" axis rides lightweight-charts' time scale. */
const BASE = Date.parse("2000-01-01T00:00:00Z") / 1000;
const DAY = 86_400;

function fmtDay(time: number): string {
  return `${Math.round((time - BASE) / DAY)}d`;
}

export default function DaysAxisChart({
  series,
  log = false,
  thresholds = [],
  height = 460,
}: {
  series: DaySeries[];
  log?: boolean;
  thresholds?: { value: number; color: string; label: string }[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<string[]>([]);

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
      rightPriceScale: {
        borderVisible: false,
        mode: log ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
      timeScale: {
        borderVisible: false,
        minBarSpacing: 0.001,
        tickMarkFormatter: (time: number) => fmtDay(time),
      },
      localization: { timeFormatter: (time: number) => `day ${fmtDay(time).slice(0, -1)}` },
      crosshair: {
        horzLine: { labelBackgroundColor: "#e6a144" },
        vertLine: { labelBackgroundColor: "#e6a144" },
      },
    });

    let thresholdsDrawn = false;
    series.forEach((def, idx) => {
      if (hidden.includes(def.label)) return;
      const s = chart.addSeries(LineSeries, {
        color: def.color,
        lineWidth: (def.lineWidth ?? 2) as 1 | 2 | 3 | 4,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: idx === 0,
      });
      s.setData(
        def.points.map((p) => ({
          time: (BASE + p.day * DAY) as UTCTimestamp,
          value: p.value,
        })),
      );
      if (!thresholdsDrawn) {
        for (const t of thresholds) {
          s.createPriceLine({
            price: t.value,
            color: t.color,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: t.label,
          });
        }
        thresholdsDrawn = true;
      }
    });

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [series, log, thresholds, hidden]);

  const toggle = (label: string) =>
    setHidden((h) => (h.includes(label) ? h.filter((l) => l !== label) : [...h, label]));

  return (
    <div className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line/70 px-4 py-3">
        {series.map((s) => {
          const active = !hidden.includes(s.label);
          return (
            <button
              key={s.label}
              onClick={() => toggle(s.label)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                active
                  ? "border-faint/60 text-fg"
                  : "border-line text-faint hover:border-faint/60"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color, opacity: active ? 1 : 0.35 }}
              />
              {s.label}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          x-axis: days since event
        </span>
      </div>
      <div className="p-3">
        <div ref={containerRef} style={{ height }} className="w-full" />
      </div>
    </div>
  );
}
