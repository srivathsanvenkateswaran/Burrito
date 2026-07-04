import type { AssetSummary } from "@/lib/data";

const CHECKS: { key: keyof NonNullable<AssetSummary["maStrength"]>; label: string }[] = [
  { key: "p20", label: "Price > 20D" },
  { key: "s20_50", label: "20D > 50D" },
  { key: "s50_100", label: "50D > 100D" },
  { key: "s100_200", label: "100D > 200D" },
];

/** Green/red matrix of moving-average alignment per asset. */
export default function MaStrengthTable({ assets }: { assets: AssetSummary[] }) {
  const rows = assets.filter((a) => a.maStrength && !a.stale);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/50 p-3 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <table className="w-full border-separate border-spacing-0.5 font-mono text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-muted">Asset</th>
            {CHECKS.map((c) => (
              <th key={c.key} className="px-2 py-1 text-center font-medium text-muted">
                {c.label}
              </th>
            ))}
            <th className="px-2 py-1 text-center font-medium text-muted">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const score = CHECKS.filter((c) => a.maStrength![c.key]).length;
            return (
              <tr key={a.id}>
                <td className="px-2 py-1.5 font-sans font-medium text-fg">{a.symbol}</td>
                {CHECKS.map((c) => {
                  const on = a.maStrength![c.key];
                  return (
                    <td
                      key={c.key}
                      className="rounded-sm px-2 py-1.5 text-center"
                      style={{
                        backgroundColor: on
                          ? "rgba(130, 181, 122, 0.35)"
                          : "rgba(222, 107, 90, 0.3)",
                      }}
                    >
                      {on ? "✓" : "✕"}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center text-muted">{score}/4</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-1 pt-2 text-[11px] text-faint">
        4/4 = fully bullish MA stack (each faster average above the slower one) · 0/4 = fully bearish
      </div>
    </div>
  );
}
