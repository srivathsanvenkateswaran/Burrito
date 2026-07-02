/** Grouped vertical bars over labeled categories (months, digits, days…). */
export interface BarSeries {
  label: string;
  color: string;
  values: (number | null)[];
}

interface Props {
  categories: string[];
  series: BarSeries[];
  unit?: string;
  height?: number;
  showValues?: boolean;
}

export default function CategoryBars({
  categories,
  series,
  unit = "%",
  height = 340,
  showValues = false,
}: Props) {
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const maxAbs = Math.max(...all.map(Math.abs), 1e-9);
  const hasNeg = all.some((v) => v < 0);
  // with negatives the baseline sits mid-chart; otherwise bars grow from the floor
  const zeroPct = hasNeg ? 50 : 0;
  const scalePct = hasNeg ? 48 : 96;

  return (
    <div className="rounded-xl border border-line bg-surface/50 p-4 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="relative" style={{ height }}>
        {hasNeg && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-faint/40"
            style={{ bottom: "50%" }}
          />
        )}
        <div className="flex h-full items-stretch gap-[3%]" style={{ paddingBottom: 20 }}>
          {categories.map((cat, ci) => (
            <div key={cat} className="relative flex-1">
              <div className="absolute inset-x-0 top-0 flex h-full items-end justify-center gap-px">
                {series.map((s) => {
                  const v = s.values[ci];
                  if (v === null || v === undefined)
                    return <div key={s.label} className="h-full flex-1" />;
                  const h = (Math.abs(v) / maxAbs) * scalePct;
                  return (
                    <div key={s.label} className="relative h-full flex-1" title={`${cat} · ${s.label}: ${v.toFixed(2)}${unit}`}>
                      <div
                        className="absolute inset-x-0 rounded-sm"
                        style={{
                          backgroundColor: s.color,
                          height: `${h}%`,
                          bottom: v >= 0 ? `${zeroPct}%` : `${zeroPct - h}%`,
                        }}
                      />
                      {showValues && series.length === 1 && (
                        <div
                          className="absolute inset-x-0 text-center font-mono text-[10px] text-muted"
                          style={
                            v >= 0
                              ? { bottom: `calc(${zeroPct + h}% + 2px)` }
                              : { top: `calc(${100 - zeroPct + h}% + 2px)` }
                          }
                        >
                          {v.toFixed(1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-x-0 bottom-[-20px] truncate text-center font-mono text-[10px] text-faint">
                {cat}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
