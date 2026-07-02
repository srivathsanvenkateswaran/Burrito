"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  LineSeries,
  PriceScaleMode,
  type UTCTimestamp,
} from "lightweight-charts";
import { riskColor } from "@/lib/colors";

export interface RiskPricePoint {
  date: string;
  close: number;
  risk: number | null;
}

export default function RiskColoredPrice({ points }: { points: RiskPricePoint[] }) {
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
      crosshair: {
        horzLine: { labelBackgroundColor: "#e6a144" },
        vertLine: { labelBackgroundColor: "#e6a144" },
      },
    });

    const s = chart.addSeries(LineSeries, {
      lineWidth: 2,
      priceLineVisible: false,
    });
    s.setData(
      points.map((p) => ({
        time: (Date.parse(`${p.date}T00:00:00Z`) / 1000) as UTCTimestamp,
        value: p.close,
        color: p.risk === null ? "rgba(162,147,130,0.6)" : riskColor(p.risk),
      })),
    );

    const raf = requestAnimationFrame(() => chart.timeScale().fitContent());
    return () => {
      cancelAnimationFrame(raf);
      chart.remove();
    };
  }, [points]);

  return (
    <div className="rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div className="flex items-center gap-2 border-b border-line/70 px-4 py-2.5 text-xs text-muted">
        <span
          className="h-2 w-24 rounded-full"
          style={{
            background: "linear-gradient(90deg, rgb(130,181,122), rgb(230,161,68), rgb(222,107,90))",
          }}
        />
        low risk → high risk
      </div>
      <div className="p-3">
        <div ref={containerRef} className="h-[460px] w-full" />
      </div>
    </div>
  );
}
