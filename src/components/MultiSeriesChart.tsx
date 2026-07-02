"use client";

import { useEffect, useRef } from "react";
import { useChartColors } from "./ThemeProvider";
import {
  AreaSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

export interface SeriesDef {
  label: string;
  color: string;
  type?: "line" | "histogram" | "area";
  dashed?: boolean;
  lineWidth?: number;
  /** left = secondary axis (e.g. log price behind an indicator) */
  scale?: "right" | "left";
  /** null values render as gaps in the line */
  points: { date: string; value: number | null }[];
}

export interface ChartMarker {
  date: string;
  position: "aboveBar" | "belowBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle" | "square";
  text?: string;
}

interface Props {
  series: SeriesDef[];
  /** attached to the first series */
  markers?: ChartMarker[];
  thresholds?: { value: number; color: string; label: string }[];
  rightLog?: boolean;
  leftLog?: boolean;
  height?: number;
  showLegend?: boolean;
}

function ts(date: string): UTCTimestamp {
  return (Date.parse(`${date}T00:00:00Z`) / 1000) as UTCTimestamp;
}

export default function MultiSeriesChart({
  series,
  markers = [],
  thresholds = [],
  rightLog = false,
  leftLog = false,
  height = 460,
  showLegend = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cc = useChartColors();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hasLeft = series.some((s) => s.scale === "left");
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
      rightPriceScale: {
        borderVisible: false,
        mode: rightLog ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
      leftPriceScale: {
        visible: hasLeft,
        borderVisible: false,
        mode: leftLog ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
      timeScale: { borderVisible: false, minBarSpacing: 0.001 },
      crosshair: {
        horzLine: { labelBackgroundColor: cc.crosshair },
        vertLine: { labelBackgroundColor: cc.crosshair },
      },
    });

    let firstSeries: ISeriesApi<"Line" | "Histogram" | "Area"> | null = null;
    series.forEach((def, idx) => {
      const common = {
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: def.scale === "left" ? "left" : "right",
      };
      let s: ISeriesApi<"Line" | "Histogram" | "Area">;
      if (def.type === "histogram") {
        s = chart.addSeries(HistogramSeries, { ...common, color: def.color, base: 0 });
      } else if (def.type === "area") {
        s = chart.addSeries(AreaSeries, {
          ...common,
          lineColor: def.color,
          lineWidth: (def.lineWidth ?? 2) as 1 | 2 | 3 | 4,
          topColor: `${def.color}2e`,
          bottomColor: `${def.color}00`,
        });
      } else {
        s = chart.addSeries(LineSeries, {
          ...common,
          color: def.color,
          lineWidth: (def.lineWidth ?? 2) as 1 | 2 | 3 | 4,
          lineStyle: def.dashed ? LineStyle.Dashed : LineStyle.Solid,
          crosshairMarkerVisible: idx === 0,
        });
      }
      s.setData(
        def.points.map((p) =>
          p.value === null ? { time: ts(p.date) } : { time: ts(p.date), value: p.value },
        ),
      );
      if (idx === 0) firstSeries = s;
    });

    if (firstSeries) {
      for (const t of thresholds) {
        (firstSeries as ISeriesApi<"Line">).createPriceLine({
          price: t.value,
          color: t.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: t.label,
        });
      }
      if (markers.length > 0) {
        const ms: SeriesMarker<Time>[] = markers.map((m) => ({
          time: ts(m.date),
          position: m.position,
          color: m.color,
          shape: m.shape,
          text: m.text,
        }));
        createSeriesMarkers(firstSeries, ms);
      }
    }

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [series, markers, thresholds, rightLog, leftLog, cc]);

  return (
    <div className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      {showLegend && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line/70 px-4 py-2.5">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="p-3">
        <div ref={containerRef} style={{ height }} className="w-full" />
      </div>
    </div>
  );
}
