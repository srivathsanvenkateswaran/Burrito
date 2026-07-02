/**
 * Pure metric math over daily close series. Everything operates on aligned
 * arrays; null means "not enough history yet at this index".
 */

export function sma(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function ema(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < n) return out;
  const k = 2 / (n + 1);
  let prev = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = prev;
  for (let i = n; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's RSI. */
export function rsi(values: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= n) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= n;
  loss /= n;
  out[n] = 100 - 100 / (1 + (loss === 0 ? Infinity : gain / loss));
  for (let i = n + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = 100 - 100 / (1 + (loss === 0 ? Infinity : gain / loss));
  }
  return out;
}

export interface LogRegression {
  slope: number;
  intercept: number;
  /** Std dev of ln-space residuals. */
  sigma: number;
  /** Fair value for a given day-count since genesis. */
  fair(daysSinceGenesis: number): number;
}

/**
 * Cowen-style logarithmic regression: ln(price) = a·ln(t) + b, with t = days
 * since the chain's genesis. Fit by least squares over the full series.
 */
export function fitLogRegression(
  daysSinceGenesis: number[],
  closes: number[],
): LogRegression {
  const xs = daysSinceGenesis.map((t) => Math.log(t));
  const ys = closes.map((c) => Math.log(c));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    ss += (ys[i] - (slope * xs[i] + intercept)) ** 2;
  }
  const sigma = Math.sqrt(ss / n);
  return {
    slope,
    intercept,
    sigma,
    fair: (t) => Math.exp(slope * Math.log(t) + intercept),
  };
}

/**
 * Risk metric v1 (0–1): ln-space deviation from log-regression fair value,
 * percentile-ranked within a trailing 4-year window so each cycle is judged
 * against recent history rather than 2011-era extremes. First year is null.
 */
export function riskMetric(
  closes: number[],
  fairs: number[],
  windowDays = 1460,
  warmupDays = 365,
): (number | null)[] {
  const d = closes.map((c, i) => Math.log(c / fairs[i]));
  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = warmupDays; i < d.length; i++) {
    const start = Math.max(0, i - windowDays + 1);
    let below = 0;
    let count = 0;
    for (let j = start; j <= i; j++) {
      if (d[j] < d[i]) below++;
      count++;
    }
    out[i] = count > 1 ? below / (count - 1) : null;
  }
  return out;
}

export interface MonthlyReturn {
  year: number;
  month: number; // 1–12
  pct: number;
}

/** Month-over-month close returns from (date, close) rows. */
export function monthlyReturns(
  rows: { date: string; close: number }[],
): MonthlyReturn[] {
  const lastCloseByMonth = new Map<string, number>();
  for (const r of rows) lastCloseByMonth.set(r.date.slice(0, 7), r.close);
  const months = [...lastCloseByMonth.keys()].sort();
  const out: MonthlyReturn[] = [];
  for (let i = 1; i < months.length; i++) {
    const prev = lastCloseByMonth.get(months[i - 1])!;
    const cur = lastCloseByMonth.get(months[i])!;
    out.push({
      year: Number(months[i].slice(0, 4)),
      month: Number(months[i].slice(5, 7)),
      pct: ((cur - prev) / prev) * 100,
    });
  }
  return out;
}
