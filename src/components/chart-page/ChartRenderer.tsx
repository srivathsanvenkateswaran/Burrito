"use client";

/**
 * Fetches a chart's spec (public/chart-data/<asset>/<slug>.json, written by
 * scripts/build-chart-data.ts) and renders its blocks with the same components
 * the server used to render inline. Keeping the series out of the HTML and the
 * RSC payload is what took the chart pages from megabytes to kilobytes.
 */
import { useEffect, useState } from "react";
import type { Block, ChartSpec } from "@/lib/chartSpec";
import ChartCard from "@/components/ChartCard";
import CategoryBars from "@/components/CategoryBars";
import CorrelationMatrix from "@/components/CorrelationMatrix";
import CryptoHeatmap from "@/components/CryptoHeatmap";
import DaysAxisChart from "@/components/DaysAxisChart";
import HypotheticalsTable from "@/components/HypotheticalsTable";
import MaStrengthTable from "@/components/MaStrengthTable";
import MetricChart from "@/components/MetricChart";
import MilestoneChart from "@/components/MilestoneChart";
import MultiSeriesChart from "@/components/MultiSeriesChart";
import PeriodHeatmap from "@/components/PeriodHeatmap";
import PriceChart from "@/components/PriceChart";
import RiskColoredPrice from "@/components/RiskColoredPrice";
import AssetTable from "@/components/AssetTable";
import YtdRoiChart from "@/components/YtdRoiChart";

function renderBlock(block: Block) {
  switch (block.kind) {
    case "multi-series":
      return <MultiSeriesChart {...block.props} />;
    case "metric":
      return <MetricChart {...block.props} />;
    case "price":
      return <PriceChart {...block.props} />;
    case "risk-colored":
      return <RiskColoredPrice {...block.props} />;
    case "days-axis":
      return <DaysAxisChart {...block.props} />;
    case "milestone":
      return <MilestoneChart {...block.props} />;
    case "ytd-roi":
      return <YtdRoiChart {...block.props} />;
    case "period-heatmap":
      return (
        <ChartCard>
          <PeriodHeatmap {...block.props} />
        </ChartCard>
      );
    case "category-bars":
      return <CategoryBars {...block.props} />;
    case "asset-table":
      return <AssetTable {...block.props} />;
    case "crypto-heatmap":
      return <CryptoHeatmap {...block.props} />;
    case "correlation-matrix":
      return <CorrelationMatrix {...block.props} />;
    case "ma-strength":
      return <MaStrengthTable {...block.props} />;
    case "hypotheticals":
      return <HypotheticalsTable {...block.props} />;
    case "note":
      return <p className="text-sm text-muted">{block.props.text}</p>;
    case "heading":
      return (
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          {block.props.text}
        </div>
      );
  }
}

/** A heading carries its own `mb-2`; every other block gets the usual 1.5rem gap. */
function spacing(blocks: Block[], i: number): string {
  if (i === 0) return "";
  return blocks[i - 1].kind === "heading" ? "" : "mt-6";
}

export default function ChartRenderer({
  src,
  height = 460,
}: {
  src: string;
  /** Plot height of the placeholder, so the page doesn't jump when data lands. */
  height?: number;
}) {
  // The result carries the src it came from, so a change of src falls back to
  // the placeholder without the effect having to reset state synchronously.
  const [loaded, setLoaded] = useState<{ src: string; spec: ChartSpec | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<ChartSpec>;
      })
      .then((data) => {
        if (!cancelled) setLoaded({ src, spec: data });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ src, spec: null });
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const current = loaded && loaded.src === src ? loaded : null;

  if (current && !current.spec) {
    return (
      <p className="text-sm text-muted">
        This chart&apos;s data could not be loaded. Reload the page to try again.
      </p>
    );
  }

  if (!current?.spec) {
    return (
      <div
        aria-busy="true"
        className="animate-pulse rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]"
      >
        <div className="h-[45px] border-b border-line/70" />
        <div className="p-3">
          <div className="w-full rounded-lg bg-raise/60" style={{ height }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {current.spec.blocks.map((block, i) => (
        <div key={i} className={spacing(current.spec!.blocks, i)}>
          {renderBlock(block)}
        </div>
      ))}
    </>
  );
}
