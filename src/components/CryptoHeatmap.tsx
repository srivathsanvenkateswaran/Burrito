import type { AssetSummary } from "@/lib/data";

/** Mcap-weighted tile grid, colored by 24h change. */
export default function CryptoHeatmap({ assets }: { assets: AssetSummary[] }) {
  const withMcap = assets.filter((a) => a.mcap !== null && !a.stale);
  const total = withMcap.reduce((s, a) => s + a.mcap!, 0);

  return (
    <div className="rounded-xl border border-line bg-surface/50 p-3 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <div className="flex flex-wrap gap-1.5">
        {withMcap.map((a) => {
          const share = a.mcap! / total;
          // sqrt scaling keeps small caps visible while big caps dominate
          const basis = Math.max(Math.sqrt(share) * 100, 7);
          const chg = a.chg24h;
          const alpha = Math.min(Math.abs(chg) / 8, 1) * 0.6 + 0.12;
          const bg =
            chg >= 0 ? `rgba(130, 181, 122, ${alpha})` : `rgba(222, 107, 90, ${alpha})`;
          return (
            <div
              key={a.id}
              title={`${a.name} · $${(a.mcap! / 1e9).toFixed(1)}B · ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`}
              className="flex min-h-16 grow flex-col items-center justify-center rounded-md px-2 py-3"
              style={{ flexBasis: `${basis}%`, backgroundColor: bg }}
            >
              <span className="font-sans text-sm font-semibold text-fg">{a.symbol}</span>
              <span className="font-mono text-[11px] text-fg/80">
                {chg >= 0 ? "+" : ""}
                {chg.toFixed(1)}%
              </span>
              {share > 0.04 && (
                <span className="font-mono text-[10px] text-fg/60">
                  ${(a.mcap! / 1e9).toFixed(0)}B
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-1 pt-2 text-[11px] text-faint">
        tile area ∝ √market cap · color = 24h change · hover for detail
      </div>
    </div>
  );
}
