const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface MonthlyReturn {
  year: number;
  month: number;
  pct: number;
}

function cellStyle(pct: number | undefined) {
  if (pct === undefined) return {};
  const alpha = Math.min(Math.abs(pct) / 30, 1) * 0.55 + 0.08;
  return {
    backgroundColor:
      pct >= 0 ? `rgba(16, 185, 129, ${alpha})` : `rgba(239, 68, 68, ${alpha})`,
  };
}

export default function MonthlyHeatmap({ returns }: { returns: MonthlyReturn[] }) {
  const byYear = new Map<number, Map<number, number>>();
  for (const r of returns) {
    if (!byYear.has(r.year)) byYear.set(r.year, new Map());
    byYear.get(r.year)!.set(r.month, r.pct);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 font-mono text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-neutral-500">Year</th>
            {MONTHS.map((m) => (
              <th key={m} className="px-1 py-1 text-right font-medium text-neutral-500">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((y) => (
            <tr key={y}>
              <td className="px-2 py-1 text-neutral-400">{y}</td>
              {MONTHS.map((_, i) => {
                const pct = byYear.get(y)!.get(i + 1);
                return (
                  <td
                    key={i}
                    className="rounded-sm px-1 py-1 text-right tabular-nums"
                    style={cellStyle(pct)}
                  >
                    {pct === undefined ? "" : pct.toFixed(1)}
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
