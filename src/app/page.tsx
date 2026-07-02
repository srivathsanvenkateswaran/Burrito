import Link from "next/link";
import { CHARTS } from "@/lib/charts";
import { loadMetrics } from "@/lib/data";
import PriceChart from "@/components/PriceChart";

function riskTone(risk: number): string {
  if (risk < 0.25) return "text-emerald-400";
  if (risk < 0.5) return "text-lime-400";
  if (risk < 0.75) return "text-amber-400";
  return "text-red-400";
}

function Stat({
  label,
  value,
  tone = "text-neutral-100",
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-1 font-mono text-lg ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
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
    <main className="px-8 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-neutral-600">Dashboard</div>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Bitcoin</h1>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl">
            ${latest.close.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          <div
            className={`font-mono text-sm ${dayChange >= 0 ? "text-emerald-500" : "text-red-500"}`}
          >
            {dayChange >= 0 ? "+" : ""}
            {dayChange.toFixed(2)}% · {latest.date}
          </div>
        </div>
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
          sub="log regression"
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
          All charts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHARTS.map((c) => (
            <Link
              key={c.slug}
              href={`/charts/${c.slug}`}
              className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-900"
            >
              <div className="text-[11px] uppercase tracking-wider text-neutral-600">
                {c.category}
              </div>
              <div className="mt-1 text-sm font-medium text-neutral-200">{c.title}</div>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
