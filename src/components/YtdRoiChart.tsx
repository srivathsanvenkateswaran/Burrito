"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColorType,
  createChart,
  LineSeries,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";

export interface YearSeries {
  year: number;
  points: { md: string; pct: number }[];
}

/** Categorical palette tuned to the comal theme; cycles past 12 years. */
const PALETTE = [
  "#e6a144",
  "#8ba7c9",
  "#82b57a",
  "#de6b5a",
  "#b391bf",
  "#7fb5a8",
  "#c07a4a",
  "#a8a862",
  "#cf8fa8",
  "#ede3d4",
  "#909c6b",
  "#c9a06a",
];

/** All series share dummy leap-year 2000 so Jan–Dec aligns across years. */
function ts(md: string): UTCTimestamp {
  return (Date.parse(`2000-${md}T00:00:00Z`) / 1000) as UTCTimestamp;
}

/** The 4-year cycle rhythm, anchored to the 2012 halving; self-extends. */
const PRESETS: { label: string; pick: (years: number[]) => number[] }[] = [
  { label: "last 3", pick: (ys) => ys.slice(-3) },
  { label: "halving", pick: (ys) => ys.filter((y) => (y - 2012) % 4 === 0) },
  { label: "post-halving", pick: (ys) => ys.filter((y) => (y - 2013) % 4 === 0) },
  { label: "bear", pick: (ys) => ys.filter((y) => (y - 2014) % 4 === 0) },
];

function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function YtdRoiChart({ data }: { data: YearSeries[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const years = data.map((d) => d.year);
  const [selected, setSelected] = useState<number[]>(years.slice(-3));

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
      timeScale: {
        borderVisible: false,
        tickMarkFormatter: (time: number) =>
          new Date(time * 1000).toLocaleDateString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
      },
      localization: {
        timeFormatter: (time: number) =>
          new Date(time * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          }),
      },
      crosshair: {
        horzLine: { labelBackgroundColor: "#e6a144" },
        vertLine: { labelBackgroundColor: "#e6a144" },
      },
    });

    let first = true;
    for (const series of data) {
      if (!selected.includes(series.year)) continue;
      const line = chart.addSeries(LineSeries, {
        color: PALETTE[years.indexOf(series.year) % PALETTE.length],
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: String(series.year),
      });
      line.setData(
        series.points.map((p) => ({ time: ts(p.md), value: p.pct })),
      );
      if (first) {
        line.createPriceLine({
          price: 0,
          color: "rgba(162, 147, 130, 0.5)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
          title: "",
        });
        first = false;
      }
    }

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [data, selected, years]);

  const toggle = (year: number) =>
    setSelected((s) =>
      s.includes(year) ? s.filter((y) => y !== year) : [...s, year].sort(),
    );

  return (
    <div className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-3">
        <div className="flex gap-0.5 rounded-md bg-ink p-0.5">
          {PRESETS.map(({ label, pick }) => {
            const active = sameSet(selected, pick(years));
            return (
              <button
                key={label}
                onClick={() => setSelected(pick(years))}
                className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                  active ? "bg-fg text-ink" : "text-muted hover:bg-raise hover:text-fg"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="h-4 w-px bg-line" />
        <div className="flex flex-wrap items-center gap-1.5">
        {years.map((y) => {
          const active = selected.includes(y);
          return (
            <button
              key={y}
              onClick={() => toggle(y)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                active
                  ? "border-faint/60 text-fg"
                  : "border-line text-faint hover:border-faint/60"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: PALETTE[years.indexOf(y) % PALETTE.length],
                  opacity: active ? 1 : 0.35,
                }}
              />
              {y}
            </button>
          );
        })}
        </div>
      </div>
      <div className="p-3">
        <div ref={containerRef} className="h-[52vh] min-h-[360px] w-full" />
      </div>
    </div>
  );
}
