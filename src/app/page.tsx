import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { CHARTS } from "@/lib/charts";
import { loadMetrics, loadTa } from "@/lib/data";
import { riskColor } from "@/lib/colors";

const FEATURED = [
  "risk",
  "asymmetric-quantile-regression-fan",
  "price",
  "roi-after-halving",
  "ytd-roi",
  "monthly-returns",
];

function Sparkline({ points }: { points: number[] }) {
  const w = 480;
  const h = 120;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const xy = points.map((v, i) => [
    (i / (points.length - 1)) * w,
    h - ((v - min) / (max - min || 1)) * (h - 8) - 4,
  ]);
  const path = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path}L${w},${h}L0,${h}Z`} fill="url(#spark)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}

export default function Landing() {
  const rows = loadMetrics().rows;
  const latest = rows.at(-1)!;
  const prev = rows.at(-2)!;
  const changePct = ((latest.close - prev.close) / prev.close) * 100;
  const risk = latest.risk ?? 0.5;
  const drawdown = loadTa().rows.at(-1)!.drawdown ?? 0;
  const yearCloses = rows.slice(-365).map((r) => r.close);
  const featured = FEATURED.map((slug) => CHARTS.find((c) => c.slug === slug)!);

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-display text-xl font-extrabold tracking-tight">
          Burrito<span className="text-accent">.</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="rounded-md bg-fg px-3.5 py-1.5 text-sm font-medium text-ink transition-opacity hover:opacity-85"
          >
            Open dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="grid items-center gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div>
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              quantitative market analysis
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Every market,
              <br />
              one tortilla<span className="text-accent">.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              {CHARTS.length} charts of Bitcoin risk, cycles, and returns — recomputed
              daily from raw market data. No hype, no paywall, just math on a warm plate.
            </p>
            <div className="mt-7 flex gap-3">
              <Link
                href="/dashboard"
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-85"
              >
                Open dashboard
              </Link>
              <Link
                href="/charts/risk"
                className="rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-faint/60 hover:text-fg"
              >
                See the risk metric
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface/50 p-5 shadow-[inset_0_1px_0_rgba(237,227,212,0.04)]">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                today&apos;s read · {latest.date}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-mono text-3xl text-fg">
                ${latest.close.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className={`font-mono text-sm ${changePct >= 0 ? "text-gain" : "text-loss"}`}>
                {changePct >= 0 ? "+" : ""}
                {changePct.toFixed(2)}%
              </span>
            </div>
            <div className="mt-3 h-24">
              <Sparkline points={yearCloses} />
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-mono uppercase tracking-[0.15em] text-faint">risk</span>
                <span className="font-mono" style={{ color: riskColor(risk) }}>
                  {risk.toFixed(2)} · {risk < 0.25 ? "accumulation zone" : risk < 0.75 ? "mid-cycle" : "euphoria"}
                </span>
              </div>
              <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-gain via-accent to-loss opacity-90">
                <span
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-fg"
                  style={{ left: `${risk * 100}%` }}
                />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/70 pt-4 font-mono text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-faint">fair value</div>
                <div className="mt-0.5 text-fg">
                  ${(latest.fair ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-faint">from ATH</div>
                <div className={`mt-0.5 ${drawdown >= 0 ? "text-gain" : "text-loss"}`}>
                  {drawdown.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
              featured charts
            </h2>
            <Link href="/dashboard" className="text-xs text-muted transition-colors hover:text-fg">
              all {CHARTS.length} charts →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
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

      <footer className="border-t border-line/70">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 text-xs text-faint">
          <span>updated daily · data through {latest.date}</span>
          <span>not financial advice, just a burrito 🌯</span>
        </div>
      </footer>
    </div>
  );
}
