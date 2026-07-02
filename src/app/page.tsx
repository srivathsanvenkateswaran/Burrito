import fs from "node:fs";
import path from "node:path";
import PriceChart, { type MetricRow } from "@/components/PriceChart";
import MetricChart from "@/components/MetricChart";
import MonthlyHeatmap, { type MonthlyReturn } from "@/components/MonthlyHeatmap";

interface MetricsFile {
  updatedThrough: string;
  rows: (MetricRow & { risk: number | null; mayer: number | null; rsi14: number | null })[];
}

function loadJson<T>(...segments: string[]): T {
  const file = path.join(process.cwd(), "data", ...segments);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

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
  const metrics = loadJson<MetricsFile>("metrics", "btc", "daily.json");
  const returns = loadJson<MonthlyReturn[]>("metrics", "btc", "monthly-returns.json");

  const rows = metrics.rows;
  const latest = rows.at(-1)!;
  const prev = rows.at(-2)!;
  const dayChange = ((latest.close - prev.close) / prev.close) * 100;

  const riskPoints = rows.flatMap((r) =>
    r.risk === null ? [] : [{ date: r.date, value: r.risk }],
  );
  // 2011-era Mayer spikes (8×+) crush the y-axis for everything after.
  const mayerPoints = rows.flatMap((r) =>
    r.mayer === null || r.date < "2013-01-01" ? [] : [{ date: r.date, value: r.mayer }],
  );
  const rsiPoints = rows.flatMap((r) =>
    r.rsi14 === null ? [] : [{ date: r.date, value: r.rsi14 }],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🌯 burrito</h1>
          <p className="mt-1 text-sm text-neutral-500">every market, one tortilla</p>
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

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Risk"
          value={latest.risk === null ? "—" : latest.risk.toFixed(3)}
          tone={latest.risk === null ? undefined : riskTone(latest.risk)}
          sub="0 = cheap · 1 = euphoric"
        />
        <Stat
          label="Fair value"
          value={latest.fair === null ? "—" : `$${latest.fair.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
          BTC / USD
        </h2>
        <PriceChart rows={rows} />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-medium uppercase tracking-wider text-neutral-500">
          Risk metric
        </h2>
        <p className="mb-3 text-xs text-neutral-600">
          ln-space deviation from log-regression fair value, percentile-ranked over a
          trailing 4-year window. v1 — calibration ongoing.
        </p>
        <MetricChart
          points={riskPoints}
          colorByValue
          height={260}
          thresholds={[
            { value: 0.8, color: "rgba(239,68,68,0.6)", label: "take profit" },
            { value: 0.2, color: "rgba(34,197,94,0.6)", label: "accumulate" },
          ]}
        />
      </section>

      <div className="mb-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
            Mayer Multiple
          </h2>
          <MetricChart
            points={mayerPoints}
            color="#3b82f6"
            thresholds={[
              { value: 2.4, color: "rgba(239,68,68,0.6)", label: "hot" },
              { value: 0.8, color: "rgba(34,197,94,0.6)", label: "cheap" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
            RSI (14d)
          </h2>
          <MetricChart
            points={rsiPoints}
            color="#a855f7"
            thresholds={[
              { value: 70, color: "rgba(239,68,68,0.6)", label: "overbought" },
              { value: 30, color: "rgba(34,197,94,0.6)", label: "oversold" },
            ]}
          />
        </section>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
          Monthly returns (%)
        </h2>
        <MonthlyHeatmap returns={returns} />
      </section>

      <footer className="border-t border-neutral-900 pt-4 text-xs text-neutral-600">
        data through {metrics.updatedThrough} · updates daily · not financial advice,
        just a burrito
      </footer>
    </main>
  );
}
