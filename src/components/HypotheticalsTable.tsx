import type { AssetSummary } from "@/lib/data";

function fmtPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(3);
}

/** "Price of X at Y's market cap" grid: rows = assets, columns = target mcaps. */
export default function HypotheticalsTable({ assets }: { assets: AssetSummary[] }) {
  const withMcap = assets.filter((a) => a.mcap !== null && !a.stale);
  const targets = withMcap.slice(0, 5);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/50 p-3 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b border-line/70 text-left text-[10px] uppercase tracking-[0.15em] text-faint">
            <th className="px-3 py-2 font-medium">Asset</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
            {targets.map((t) => (
              <th key={t.id} className="px-3 py-2 text-right font-medium">
                at {t.symbol}&apos;s mcap
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {withMcap.map((a) => (
            <tr key={a.id} className="border-b border-line/40 last:border-0">
              <td className="px-3 py-2 font-sans font-medium text-fg">{a.symbol}</td>
              <td className="px-3 py-2 text-right text-muted">${fmtPrice(a.close)}</td>
              {targets.map((t) => {
                if (t.id === a.id)
                  return (
                    <td key={t.id} className="px-3 py-2 text-right text-faint">
                      —
                    </td>
                  );
                const price = a.close * (t.mcap! / a.mcap!);
                const mult = t.mcap! / a.mcap!;
                return (
                  <td key={t.id} className="px-3 py-2 text-right">
                    <span className="text-fg">${fmtPrice(price)}</span>
                    <span className={`ml-1.5 text-[10px] ${mult >= 1 ? "text-gain" : "text-loss"}`}>
                      {mult >= 1 ? `${mult.toFixed(1)}×` : `${mult.toFixed(2)}×`}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
