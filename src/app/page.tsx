import fs from "node:fs";
import path from "node:path";
import PriceChart from "@/components/PriceChart";

interface DailySeries {
  asset: string;
  quote: string;
  updatedAt: string;
  rows: { date: string; close: number }[];
}

function loadSeries(asset: string): DailySeries {
  const file = path.join(process.cwd(), "data", "raw", asset, "daily.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export default function Home() {
  const series = loadSeries("btc");
  const latest = series.rows.at(-1)!;
  const prev = series.rows.at(-2)!;
  const dayChange = ((latest.close - prev.close) / prev.close) * 100;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🌯 burrito</h1>
          <p className="mt-1 text-sm text-neutral-500">
            every market, one tortilla
          </p>
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

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-neutral-500">
          BTC / USD · log scale · {series.rows[0].date} → {latest.date}
        </h2>
        <PriceChart
          points={series.rows.map(({ date, close }) => ({ date, close }))}
        />
      </section>
    </main>
  );
}
