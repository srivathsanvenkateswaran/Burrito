import type { AssetSummary } from "@/lib/data";
import { riskColor } from "@/lib/colors";

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(3);
}

function fmtMcap(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function Pct({ v }: { v: number | null }) {
  if (v === null) return <span className="text-faint">—</span>;
  return (
    <span className={v >= 0 ? "text-gain" : "text-loss"}>
      {v >= 0 ? "+" : ""}
      {v.toFixed(1)}%
    </span>
  );
}

export default function AssetTable({ assets }: { assets: AssetSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/50 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b border-line/70 text-left text-[10px] uppercase tracking-[0.15em] text-faint">
            <th className="px-4 py-2.5 font-medium">#</th>
            <th className="px-3 py-2.5 font-medium">Asset</th>
            <th className="px-3 py-2.5 text-right font-medium">Price</th>
            <th className="px-3 py-2.5 text-right font-medium">24h</th>
            <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">30d</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">1y</th>
            <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Mcap</th>
            <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Mayer</th>
            <th className="hidden px-3 py-2.5 text-center font-medium md:table-cell">20W</th>
            <th className="px-4 py-2.5 text-right font-medium">Risk</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((a, i) => (
            <tr key={a.id} className="border-b border-line/40 transition-colors last:border-0 hover:bg-raise/60">
              <td className="px-4 py-2.5 text-faint">{i + 1}</td>
              <td className="px-3 py-2.5">
                <span className="font-sans font-medium text-fg">{a.symbol}</span>
                <span className="ml-2 hidden font-sans text-faint lg:inline">{a.name}</span>
                {a.stale && (
                  <span className="ml-2 rounded bg-raise px-1.5 py-0.5 text-[10px] text-faint" title="Series no longer updating (delisted pair)">
                    stale
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right text-fg">${fmtPrice(a.close)}</td>
              <td className="px-3 py-2.5 text-right"><Pct v={a.chg24h} /></td>
              <td className="hidden px-3 py-2.5 text-right sm:table-cell"><Pct v={a.roi30d} /></td>
              <td className="hidden px-3 py-2.5 text-right md:table-cell"><Pct v={a.roi1y} /></td>
              <td className="hidden px-3 py-2.5 text-right text-muted sm:table-cell">{fmtMcap(a.mcap)}</td>
              <td className="hidden px-3 py-2.5 text-right text-muted md:table-cell">
                {a.mayer === null ? "—" : a.mayer.toFixed(2)}
              </td>
              <td className="hidden px-3 py-2.5 text-center md:table-cell">
                {a.above20w === null ? (
                  <span className="text-faint">—</span>
                ) : a.above20w ? (
                  <span className="text-gain">▲</span>
                ) : (
                  <span className="text-loss">▼</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-2">
                  <span style={{ color: riskColor(a.risk) }}>
                    {a.risk.toFixed(2)}
                    {a.shortHistory && (
                      <span className="text-faint" title="Short price history — low-confidence fit">
                        *
                      </span>
                    )}
                  </span>
                  <span className="h-1.5 w-12 overflow-hidden rounded-full bg-raise">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${a.risk * 100}%`, backgroundColor: riskColor(a.risk) }}
                    />
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-line/70 px-4 py-2 text-[11px] text-faint">
        * short history — the risk fit has under two years of data · stale = Binance pair no
        longer trading
      </div>
    </div>
  );
}
