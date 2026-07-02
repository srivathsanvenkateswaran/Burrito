"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  createChart,
  PriceScaleMode,
  type UTCTimestamp,
} from "lightweight-charts";

export interface ChartPoint {
  date: string;
  close: number;
}

export default function PriceChart({ points }: { points: ChartPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      rightPriceScale: {
        mode: PriceScaleMode.Logarithmic,
        borderVisible: false,
      },
      // minBarSpacing must be tiny so 16 years of daily bars can fit on screen.
      timeScale: { borderVisible: false, minBarSpacing: 0.001 },
      crosshair: {
        horzLine: { labelBackgroundColor: "#e8590c" },
        vertLine: { labelBackgroundColor: "#e8590c" },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#e8590c",
      lineWidth: 2,
      topColor: "rgba(232, 89, 12, 0.25)",
      bottomColor: "rgba(232, 89, 12, 0.0)",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    series.setData(
      points.map((p) => ({
        time: (Date.parse(`${p.date}T00:00:00Z`) / 1000) as UTCTimestamp,
        value: p.close,
      })),
    );
    // Wait a frame so autoSize has measured the container before fitting.
    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());

    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [points]);

  return <div ref={containerRef} className="h-[70vh] w-full" />;
}
