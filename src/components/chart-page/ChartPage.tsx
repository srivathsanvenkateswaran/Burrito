import { chartText } from "@/lib/chartText";
import type { ChartDef } from "@/lib/charts";
import { hasMetrics, loadMetrics, loadSupply } from "@/lib/data";
import ChartBody from "./ChartBody";
import type { ChartPageAsset } from "./types";

/** `daily.json`'s `updatedThrough` for full-suite assets; `supply.json`'s for supply-only ones. */
function updatedThrough(asset: ChartPageAsset): string {
  if (hasMetrics(asset.id)) return loadMetrics(asset.id).updatedThrough;
  try {
    return loadSupply(asset.id).updatedThrough;
  } catch {
    return "";
  }
}

/** Shared page shell for both `/charts/[slug]` (BTC) and `/assets/[asset]/[slug]`. */
export default function ChartPage({ def, asset }: { def: ChartDef; asset: ChartPageAsset }) {
  const text = chartText(def, asset);
  const through = updatedThrough(asset);

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          {def.category} · {asset.symbol}
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{text.title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">{text.description}</p>
      </header>
      <ChartBody slug={def.slug} asset={asset} />

      <section className="mt-8 max-w-3xl border-t border-line pt-6">
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          Understanding this chart
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          {text.explanation.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <footer className="mt-8 text-xs text-faint">
        {through ? `data through ${through} · updates daily` : "updates daily"}
      </footer>
    </main>
  );
}
