export interface ChartDef {
  slug: string;
  title: string;
  category: string;
  description: string;
}

export const CHARTS: ChartDef[] = [
  {
    slug: "price",
    title: "Price + Moving Averages",
    category: "Price",
    description:
      "BTC/USD with toggleable overlays: log regression bands, Bull Market Support Band (20W SMA / 21W EMA), 50W and 200W SMAs.",
  },
  {
    slug: "risk",
    title: "Risk Metric",
    category: "Risk",
    description:
      "0–1 risk score: ln-space deviation from log-regression fair value, percentile-ranked over a trailing 4-year window. v1 — calibration ongoing.",
  },
  {
    slug: "mayer",
    title: "Mayer Multiple",
    category: "Valuation",
    description: "Price divided by the 200-day SMA. Historically hot above 2.4, cheap below 0.8.",
  },
  {
    slug: "rsi",
    title: "RSI (14d)",
    category: "Momentum",
    description: "Wilder's Relative Strength Index on daily closes. Overbought above 70, oversold below 30.",
  },
  {
    slug: "running-roi",
    title: "Running ROI (1y)",
    category: "Returns",
    description: "Rolling 1-year return on investment, in percent.",
  },
  {
    slug: "monthly-returns",
    title: "Monthly Returns",
    category: "Returns",
    description: "Month-by-month close-to-close returns across the full history.",
  },
];

export const CATEGORIES = [...new Set(CHARTS.map((c) => c.category))];

export function chartBySlug(slug: string): ChartDef | undefined {
  return CHARTS.find((c) => c.slug === slug);
}
