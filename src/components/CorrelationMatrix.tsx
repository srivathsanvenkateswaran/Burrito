/** Colored Pearson-correlation grid (blue −1 → warm paper 0 → red +1). */
export default function CorrelationMatrix({
  ids,
  matrix,
}: {
  ids: string[];
  matrix: (number | null)[][];
}) {
  const cell = (v: number | null) => {
    if (v === null) return {};
    const t = Math.max(-1, Math.min(1, v));
    return {
      backgroundColor:
        t >= 0
          ? `rgba(222, 107, 90, ${Math.abs(t) * 0.75})`
          : `rgba(139, 167, 201, ${Math.abs(t) * 0.75})`,
    };
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/50 p-3 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      <table className="w-full border-separate border-spacing-0.5 font-mono text-[11px]">
        <thead>
          <tr>
            <th />
            {ids.map((id) => (
              <th key={id} className="px-1 py-1 text-center font-medium uppercase text-muted">
                {id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((row, i) => (
            <tr key={row}>
              <td className="px-1.5 py-1 font-medium uppercase text-muted">{row}</td>
              {ids.map((col, j) => (
                <td
                  key={col}
                  className="rounded-sm px-1 py-1 text-center tabular-nums"
                  style={cell(matrix[i][j])}
                  title={`${row.toUpperCase()} × ${col.toUpperCase()}: ${matrix[i][j] ?? "n/a"}`}
                >
                  {matrix[i][j] === null ? "·" : matrix[i][j]!.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-1 pt-2 text-[11px] text-faint">
        Pearson correlation of daily log returns, trailing 90 days · red +1 · blue −1
      </div>
    </div>
  );
}
