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

/** Rolling standard deviation of daily log returns, in percent. */
export function rollingVolatility(closes: number[], n: number): (number | null)[] {
  const rets = closes.map((c, i) => (i === 0 ? 0 : Math.log(c / closes[i - 1])));
  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = n; i < closes.length; i++) {
    const win = rets.slice(i - n + 1, i + 1);
    const mean = win.reduce((a, b) => a + b, 0) / n;
    const ss = win.reduce((a, b) => a + (b - mean) ** 2, 0);
    out[i] = Math.sqrt(ss / n) * 100;
  }
  return out;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalN = 9,
): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const ef = ema(values, fast);
  const es = ema(values, slow);
  const line = values.map((_, i) =>
    ef[i] === null || es[i] === null ? null : ef[i]! - es[i]!,
  );
  const defined = line.filter((v): v is number => v !== null);
  const sigDefined = ema(defined, signalN);
  const signal: (number | null)[] = new Array(values.length).fill(null);
  let j = 0;
  for (let i = 0; i < values.length; i++) {
    if (line[i] !== null) {
      signal[i] = sigDefined[j];
      j++;
    }
  }
  const hist = line.map((v, i) =>
    v === null || signal[i] === null ? null : v - signal[i]!,
  );
  return { macd: line, signal, hist };
}

export function bollinger(
  values: number[],
  n = 20,
  k = 2,
): { mid: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const mid = sma(values, n);
  const upper: (number | null)[] = new Array(values.length).fill(null);
  const lower: (number | null)[] = new Array(values.length).fill(null);
  for (let i = n - 1; i < values.length; i++) {
    const win = values.slice(i - n + 1, i + 1);
    const m = mid[i]!;
    const sd = Math.sqrt(win.reduce((a, b) => a + (b - m) ** 2, 0) / n);
    upper[i] = m + k * sd;
    lower[i] = m - k * sd;
  }
  return { mid, upper, lower };
}

/** Dates where `fast` crosses `slow`: up = golden, down = death. */
export function crossDates(
  dates: string[],
  fast: (number | null)[],
  slow: (number | null)[],
): { date: string; type: "up" | "down" }[] {
  const out: { date: string; type: "up" | "down" }[] = [];
  for (let i = 1; i < dates.length; i++) {
    if (fast[i - 1] === null || slow[i - 1] === null || fast[i] === null || slow[i] === null)
      continue;
    const was = fast[i - 1]! - slow[i - 1]!;
    const is = fast[i]! - slow[i]!;
    if (was <= 0 && is > 0) out.push({ date: dates[i], type: "up" });
    else if (was >= 0 && is < 0) out.push({ date: dates[i], type: "down" });
  }
  return out;
}

/**
 * For each day, days elapsed since the last single-day move of at least
 * `pct` percent in the given direction (counter resets to 0 on event days).
 */
export function daysSinceMove(
  closes: number[],
  pct: number,
  direction: "decline" | "gain",
): number[] {
  const out: number[] = new Array(closes.length).fill(0);
  let count = 0;
  for (let i = 1; i < closes.length; i++) {
    const change = (closes[i] / closes[i - 1] - 1) * 100;
    const hit = direction === "decline" ? change <= -pct : change >= pct;
    count = hit ? 0 : count + 1;
    out[i] = count;
  }
  return out;
}

/** Leading-digit distribution of a series vs. Benford's expected frequencies. */
export function benford(values: number[]): { digit: number; actual: number; expected: number }[] {
  const counts = new Array(10).fill(0);
  let total = 0;
  for (const v of values) {
    if (v <= 0) continue;
    const d = Number(String(v).replace(/[^1-9]/g, "")[0]);
    if (d >= 1) {
      counts[d]++;
      total++;
    }
  }
  return Array.from({ length: 9 }, (_, i) => ({
    digit: i + 1,
    actual: (counts[i + 1] / total) * 100,
    expected: Math.log10(1 + 1 / (i + 1)) * 100,
  }));
}

/** Upward + downward crossings of fixed price milestones. */
export function milestoneCrossings(
  dates: string[],
  closes: number[],
  levels: number[],
): { date: string; level: number }[] {
  const out: { date: string; level: number }[] = [];
  for (let i = 1; i < closes.length; i++) {
    for (const m of levels) {
      const crossedUp = closes[i - 1] < m && closes[i] >= m;
      const crossedDown = closes[i - 1] > m && closes[i] <= m;
      if (crossedUp || crossedDown) out.push({ date: dates[i], level: m });
    }
  }
  return out;
}

export interface MonthlyReturn {
  year: number;
  month: number; // 1–12
  pct: number;
}

/** Close-to-close quarterly returns. */
export function quarterlyReturns(
  rows: { date: string; close: number }[],
): { year: number; quarter: number; pct: number }[] {
  const lastCloseByQ = new Map<string, number>();
  for (const r of rows) {
    const q = Math.ceil(Number(r.date.slice(5, 7)) / 3);
    lastCloseByQ.set(`${r.date.slice(0, 4)}-${q}`, r.close);
  }
  const keys = [...lastCloseByQ.keys()].sort();
  const out: { year: number; quarter: number; pct: number }[] = [];
  for (let i = 1; i < keys.length; i++) {
    const prev = lastCloseByQ.get(keys[i - 1])!;
    const cur = lastCloseByQ.get(keys[i])!;
    out.push({
      year: Number(keys[i].slice(0, 4)),
      quarter: Number(keys[i].slice(5)),
      pct: ((cur - prev) / prev) * 100,
    });
  }
  return out;
}

/** ROI paths from a list of event dates, each capped at the next event (or capDays). */
export function eventRoi(
  rows: { date: string; close: number }[],
  eventDates: string[],
  capDays = 1460,
): { label: string; points: { day: number; pct: number }[] }[] {
  const out: { label: string; points: { day: number; pct: number }[] }[] = [];
  const sorted = [...eventDates].sort();
  for (let e = 0; e < sorted.length; e++) {
    const start = rows.findIndex((r) => r.date >= sorted[e]);
    if (start === -1) continue;
    const nextStart = e + 1 < sorted.length ? rows.findIndex((r) => r.date >= sorted[e + 1]) : rows.length;
    const end = Math.min(start + capDays, nextStart === -1 ? rows.length : nextStart, rows.length);
    const base = rows[start].close;
    const points = [];
    for (let i = start; i < end; i++) {
      points.push({ day: i - start, pct: Number(((rows[i].close / base - 1) * 100).toFixed(1)) });
    }
    out.push({ label: sorted[e].slice(0, 4), points });
  }
  return out;
}

/** For each date, days until close first reaches multiple × close (null if never). */
export function daysToMultiple(
  closes: number[],
  multiple: number,
): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    const target = closes[i] * multiple;
    for (let j = i + 1; j < closes.length; j++) {
      if (closes[j] >= target) {
        out[i] = j - i;
        break;
      }
    }
  }
  return out;
}

/** Supertrend (ATR period / multiplier); returns the stop line and trend direction. */
export function supertrend(
  rows: { high: number; low: number; close: number }[],
  period = 10,
  mult = 3,
): { value: number | null; up: boolean }[] {
  const n = rows.length;
  const atr: number[] = new Array(n).fill(0);
  let prevAtr = 0;
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      rows[i].high - rows[i].low,
      Math.abs(rows[i].high - rows[i - 1].close),
      Math.abs(rows[i].low - rows[i - 1].close),
    );
    prevAtr = i <= period ? (prevAtr * (i - 1) + tr) / i : (prevAtr * (period - 1) + tr) / period;
    atr[i] = prevAtr;
  }
  const out: { value: number | null; up: boolean }[] = [];
  let fu = Infinity;
  let fl = -Infinity;
  let up = true;
  for (let i = 0; i < n; i++) {
    if (i <= period) {
      out.push({ value: null, up });
      continue;
    }
    const hl2 = (rows[i].high + rows[i].low) / 2;
    const bu = hl2 + mult * atr[i];
    const bl = hl2 - mult * atr[i];
    fu = bu < fu || rows[i - 1].close > fu ? bu : fu;
    fl = bl > fl || rows[i - 1].close < fl ? bl : fl;
    if (rows[i].close > fu) up = true;
    else if (rows[i].close < fl) up = false;
    out.push({ value: up ? fl : fu, up });
  }
  return out;
}

/** Average daily % change for each day-of-month (1–31). */
export function averageDailyReturns(
  rows: { date: string; close: number }[],
): { day: number; avg: number }[] {
  const sums = new Array(32).fill(0);
  const counts = new Array(32).fill(0);
  for (let i = 1; i < rows.length; i++) {
    const day = Number(rows[i].date.slice(8, 10));
    sums[day] += (rows[i].close / rows[i - 1].close - 1) * 100;
    counts[day]++;
  }
  return Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    avg: counts[i + 1] ? sums[i + 1] / counts[i + 1] : 0,
  }));
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
