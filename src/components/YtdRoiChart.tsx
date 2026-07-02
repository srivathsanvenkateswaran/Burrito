"use client";

import { useEffect, useRef, useState } from "react";
import { useChartColors } from "./ThemeProvider";
import { ExpandButton } from "./ChartControls";
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

interface Preset {
  label: string;
  pick: (years: number[]) => number[];
}

/**
 * Both rhythms are 4-year cycles anchored by modular arithmetic, so they
 * self-extend. Note halving years and US election years coincide exactly.
 */
const PRESET_GROUPS: { name: string; presets: Preset[] }[] = [
  {
    name: "cycle",
    presets: [
      { label: "last 3", pick: (ys) => ys.slice(-3) },
      { label: "halving", pick: (ys) => ys.filter((y) => (y - 2012) % 4 === 0) },
      { label: "post-halving", pick: (ys) => ys.filter((y) => (y - 2013) % 4 === 0) },
      { label: "bear", pick: (ys) => ys.filter((y) => (y - 2014) % 4 === 0) },
    ],
  },
  {
    name: "presidential",
    presets: [
      { label: "election", pick: (ys) => ys.filter((y) => (y - 2012) % 4 === 0) },
      { label: "post-election", pick: (ys) => ys.filter((y) => (y - 2013) % 4 === 0) },
      { label: "midterm", pick: (ys) => ys.filter((y) => (y - 2014) % 4 === 0) },
      { label: "pre-election", pick: (ys) => ys.filter((y) => (y - 2015) % 4 === 0) },
    ],
  },
];

function sameSet(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function YtdRoiChart({ data }: { data: YearSeries[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cc = useChartColors();
  const years = data.map((d) => d.year);
  const [selected, setSelected] = useState<number[]>(years.slice(-3));

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
        horzLine: { labelBackgroundColor: cc.crosshair },
        vertLine: { labelBackgroundColor: cc.crosshair },
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
  }, [data, selected, years, cc]);

  const toggle = (year: number) =>
    setSelected((s) =>
      s.includes(year) ? s.filter((y) => y !== year) : [...s, year].sort(),
    );

  return (
    <div
      data-chart-card
      className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-3">
        {PRESET_GROUPS.map(({ name, presets }) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
              {name}
            </span>
            <div className="flex gap-0.5 rounded-md bg-ink p-0.5">
              {presets.map(({ label, pick }) => {
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
          </div>
        ))}
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
        <div className="ml-auto">
          <ExpandButton />
        </div>
      </div>
      <div className="p-3">
        <div ref={containerRef} className="chart-host h-[52vh] min-h-[360px] w-full" />
      </div>
    </div>
  );
}
