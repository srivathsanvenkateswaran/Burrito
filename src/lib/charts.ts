export interface ChartDef {
  slug: string;
  title: string;
  category: string;
  description: string;
  /** Longer educational text rendered below the chart, one string per paragraph. */
  explanation: string[];
}

export const CHARTS: ChartDef[] = [
  {
    slug: "price",
    title: "Price + Moving Averages",
    category: "Price",
    description:
      "BTC/USD with toggleable overlays: log regression bands, Bull Market Support Band (20W SMA / 21W EMA), 50W and 200W SMAs.",
    explanation: [
      "Bitcoin's long-term history only makes sense on a logarithmic scale: each gridline step is a multiplication (10×), not an addition. On a linear scale everything before 2017 flattens into a line at zero; on a log scale the early $1 → $100 move is given the same visual weight as $1,000 → $100,000, which is how returns actually compound.",
      "The log regression line is a best-fit curve through the entire price history in log-log space (log of price against log of time since Bitcoin's genesis block). It is a slow-moving estimate of fair value; the shaded band around it is one standard deviation of how far price has historically strayed. Price spends years above and below this line — the point is not that price follows it, but that price has always eventually reverted toward it.",
      "The Bull Market Support Band (20-week SMA and 21-week EMA) is the zone that has repeatedly acted as support during bull markets and resistance during bear markets. Weekly closes above a rising band have historically indicated bull conditions. The 50W and 200W SMAs are the longer-term regime lines: the 200W SMA in particular has marked every major cycle bottom to date.",
    ],
  },
  {
    slug: "risk",
    title: "Risk Metric",
    category: "Risk",
    description:
      "0–1 risk score: ln-space deviation from log-regression fair value, percentile-ranked over a trailing 4-year window. v1 — calibration ongoing.",
    explanation: [
      "The risk metric compresses \"how stretched is price right now?\" into a single number between 0 and 1. It measures how far price sits above or below the log-regression fair value (in log space, so percentage deviations count equally at any price level), then asks: compared to the last four years — roughly one full market cycle — how extreme is today's deviation? A reading of 0.9 means price is more extended than 90% of days in the trailing window.",
      "How to use it: low readings (green, below 0.2) have historically coincided with bear-market bottoms and accumulation zones; high readings (red, above 0.8) with euphoric tops where risk-reward favors taking profit. It is a slow signal about valuation, not a trade timer — price can stay in a high-risk band for months while a bull market tops out.",
      "Caveats: this is version 1 of our own model, not Benjamin Cowen's proprietary metric. The percentile approach means the score is always relative to recent history, and the regression fit itself shifts slowly as new data arrives. Treat the extremes as meaningful and the middle of the range as noise.",
    ],
  },
  {
    slug: "mayer",
    title: "Mayer Multiple",
    category: "Valuation",
    description: "Price divided by the 200-day SMA. Historically hot above 2.4, cheap below 0.8.",
    explanation: [
      "The Mayer Multiple, named after Trace Mayer, is simply the current price divided by its 200-day simple moving average. At 1.0, price sits exactly on its long-term trend; at 2.0 it is double the trend; below 1.0 it trades under it.",
      "The classic thresholds come from backtests over Bitcoin's history: buying when the multiple exceeded 2.4 has historically produced poor forward returns (price far above trend, late in a rally), while readings below 0.8 marked the deep-value zones of bear markets. The multiple mean-reverts: extended periods above 2 have always been followed by a return to the 200-day average.",
      "Its weakness is the same as any moving-average metric: after a violent crash the 200-day SMA itself falls, so the multiple can look \"normal\" while the market is still damaged. Read it together with the risk metric, which uses a much slower baseline.",
    ],
  },
  {
    slug: "rsi",
    title: "RSI (14d)",
    category: "Momentum",
    description: "Wilder's Relative Strength Index on daily closes. Overbought above 70, oversold below 30.",
    explanation: [
      "The Relative Strength Index (J. Welles Wilder, 1978) measures the speed of recent price changes: it compares the average size of up-days against down-days over the last 14 days and maps the result to a 0–100 scale. Persistent buying pushes it toward 100, persistent selling toward 0.",
      "The standard reading: above 70 is \"overbought\" (the rally is stretched and prone to a pause), below 30 is \"oversold\" (selling is exhausted). In strong crypto bull markets the daily RSI can pin above 70 for weeks, so overbought is not an automatic sell — the more reliable signals are oversold readings during established uptrends, and divergences, where price makes a new high but RSI makes a lower high, hinting momentum is fading.",
      "RSI is a fast momentum gauge, best for timing within a trend. It says nothing about valuation — pair it with the slower metrics (risk, Mayer) for the bigger picture.",
    ],
  },
  {
    slug: "running-roi",
    title: "Running ROI (1y)",
    category: "Returns",
    description: "Rolling 1-year return on investment, in percent.",
    explanation: [
      "Each point answers one question: if you had bought exactly one year earlier, what would your return be today? A reading of +150% means price is 2.5× what it was a year ago; −50% means it halved.",
      "The chart makes Bitcoin's cyclicality unmissable: the 1-year ROI oscillates in huge waves, from several-hundred-percent peaks in bull manias to −70%+ troughs in bear-market capitulations. The zero line is the regime boundary — extended time below it has historically been the accumulation phase, and the steep climbs off the lows mark new cycle beginnings.",
      "Note the diminishing amplitude across cycles: early peaks reached +9,000%, recent ones in the hundreds. That decay of returns as Bitcoin's market cap grows is one of the core arguments behind the log-regression approach used elsewhere on this site.",
    ],
  },
  {
    slug: "ytd-roi",
    title: "YTD ROI",
    category: "Returns",
    description:
      "Year-to-date return for each calendar year, overlayable to compare how different years unfolded.",
    explanation: [
      "Each line tracks one calendar year's cumulative return, starting from that year's first close (0% on the year's first trading day). All years are drawn on a shared January-to-December axis, so you can overlay any set of them and compare their paths day by day.",
      "Use the year pills to toggle years on and off. Overlaying the current year against past years shows whether this year is tracking a typical path or diverging; overlaying halving years (2012, 2016, 2020, 2024) against each other reveals how similar their second-half accelerations were. Post-halving years (2013, 2017, 2021, 2025) and bear years (2014, 2018, 2022) each have their own recognizable shapes.",
      "Reading tip: the absolute levels matter less than the shape. Years that spent H1 flat and exploded in Q4 look very different from years that front-loaded their gains — and where the current year sits inside that family of shapes is a quick sanity check on cycle narratives.",
    ],
  },
  {
    slug: "monthly-returns",
    title: "Monthly Returns",
    category: "Returns",
    description: "Month-by-month close-to-close returns across the full history.",
    explanation: [
      "Each cell is one month's return, measured close-to-close from the prior month's final daily close. Green months closed up, red months closed down, and the color intensity scales with the size of the move (saturating at ±30%).",
      "Scanning columns reveals Bitcoin's seasonal folklore and how real it is: October (\"Uptober\") and November have historically skewed green, September has skewed red, and the strongest months cluster in Q4. Scanning rows shows each year's character at a glance — the relentless green of 2013 and 2017, the almost unbroken red of 2018 and 2022.",
      "Seasonality in crypto is a weak effect layered on top of the cycle: a September in a raging bull market is still more likely green than an October in a deep bear. Use this as context, not as a signal on its own.",
    ],
  },
];

export const CATEGORIES = [...new Set(CHARTS.map((c) => c.category))];

export function chartBySlug(slug: string): ChartDef | undefined {
  return CHARTS.find((c) => c.slug === slug);
}
