/** Shared stat-tile markup, matching the dashboard's original BTC-only tiles. */

export function riskTone(risk: number): string {
  if (risk < 0.25) return "text-gain";
  if (risk < 0.5) return "text-fg";
  if (risk < 0.75) return "text-accent";
  return "text-loss";
}

export function Stat({
  label,
  value,
  tone = "text-fg",
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface/50 px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">{label}</div>
      <div className={`mt-1 font-mono text-lg ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </div>
  );
}
