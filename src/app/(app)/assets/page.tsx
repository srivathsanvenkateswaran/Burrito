import Link from "next/link";
import { groupAssets, PAGE_ASSETS } from "@/lib/assets";
import { assetStat } from "@/lib/assetStats";
import { loadSupply } from "@/lib/data";
import { riskColor } from "@/lib/colors";
import { fmtPct, fmtPrice } from "@/lib/format";

function fmtSupply(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

export default function AssetsIndex() {
  const groups = groupAssets(PAGE_ASSETS);

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">Assets</div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Every asset, one suite</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          {PAGE_ASSETS.length} assets across crypto, equities and indices, each fitted with the same
          risk, cycle and valuation charts Bitcoin gets.
        </p>
      </header>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.sector}>
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">{g.sector}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((a) => {
                if (a.suite === "supply") {
                  const { rows } = loadSupply(a.id);
                  const last = rows.at(-1);
                  return (
                    <Link
                      key={a.id}
                      href={`/assets/${a.id}`}
                      className="rounded-lg border border-line bg-surface/50 p-4 transition-colors hover:border-faint/60 hover:bg-raise"
                    >
                      <Card symbol={a.symbol} name={a.name} sector={a.sector} />
                      <div className="mt-3 flex items-center justify-between font-mono text-sm">
                        <span className="text-fg">{last ? fmtSupply(last.supply) : "—"}</span>
                        <span className="text-xs text-faint">circulating</span>
                      </div>
                      {last?.chg30d != null && (
                        <div className="mt-1 text-xs">
                          <span className="text-faint">30d </span>
                          <span className={last.chg30d >= 0 ? "text-gain" : "text-loss"}>
                            {fmtPct(last.chg30d)}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                }

                const stat = assetStat(a.id);
                return (
                  <Link
                    key={a.id}
                    href={`/assets/${a.id}`}
                    className="rounded-lg border border-line bg-surface/50 p-4 transition-colors hover:border-faint/60 hover:bg-raise"
                  >
                    <Card symbol={a.symbol} name={a.name} sector={a.sector} />
                    {!stat.metricsOk ? (
                      <div className="mt-3 text-xs text-faint">
                        {stat.close !== null && (
                          <span className="mr-2 font-mono text-fg">{fmtPrice(stat.close, stat.quote)}</span>
                        )}
                        history too short for metrics
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 flex items-center justify-between font-mono text-sm">
                          <span className="text-fg">{stat.close === null ? "—" : fmtPrice(stat.close, stat.quote)}</span>
                          <span className={stat.chg24h === null ? "text-faint" : stat.chg24h >= 0 ? "text-gain" : "text-loss"}>
                            {fmtPct(stat.chg24h)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-faint">
                            Mayer {stat.mayer === null ? "—" : stat.mayer.toFixed(2)}
                          </span>
                          <span
                            className="font-mono"
                            style={{ color: stat.risk === null ? undefined : riskColor(stat.risk) }}
                          >
                            {stat.risk === null ? "—" : `risk ${stat.risk.toFixed(2)}`}
                          </span>
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function Card({ symbol, name, sector }: { symbol: string; name: string; sector: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-sm font-medium text-fg">{symbol}</span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.15em] text-faint">{sector}</span>
      </div>
      <div className="mt-0.5 text-xs text-muted">{name}</div>
    </>
  );
}
