import Link from "next/link";
import { CHARTS } from "@/lib/charts";
import { loadMetrics } from "@/lib/data";
import PriceChart from "@/components/PriceChart";

function riskTone(risk: number): string {
  if (risk < 0.25) return "text-gain";
  if (risk < 0.5) return "text-fg";
  if (risk < 0.75) return "text-accent";
  return "text-loss";
}

function Stat({
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
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </div>
  );
}

export default function Home() {
  const metrics = loadMetrics();
  const rows = metrics.rows;
  const latest = rows.at(-1)!;
  const prev = rows.at(-2)!;
  const dayChange = ((latest.close - prev.close) / prev.close) * 100;

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <header className="mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          Dashboard
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Bitcoin</h1>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Risk"
          value={latest.risk === null ? "—" : latest.risk.toFixed(3)}
          tone={latest.risk === null ? undefined : riskTone(latest.risk)}
          sub="0 = cheap · 1 = euphoric"
        />
        <Stat
          label="Fair value"
          value={
            latest.fair === null
              ? "—"
              : `$${latest.fair.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
          }
          sub="fan median (τ 0.5)"
        />
        <Stat
          label="Mayer Multiple"
          value={latest.mayer === null ? "—" : latest.mayer.toFixed(2)}
          sub="price / 200d SMA"
        />
        <Stat
          label="RSI (14d)"
          value={latest.rsi14 === null ? "—" : latest.rsi14.toFixed(0)}
          sub="Wilder"
        />
      </div>

      <section className="mb-10">
        <PriceChart rows={rows} />
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          All charts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHARTS.map((c) => (
            <Link
              key={c.slug}
              href={`/charts/${c.slug}`}
              className="rounded-lg border border-line bg-surface/50 p-4 transition-colors hover:border-faint/60 hover:bg-raise"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                {c.category}
              </div>
              <div className="mt-1 text-sm font-medium text-fg">{c.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
