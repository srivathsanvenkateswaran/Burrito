/**
 * Derives the full per-asset metric suite from a raw daily series and writes
 * it to data/metrics/<id>/. Works for any asset class: lookback windows scale
 * with the series' rows-per-year, and every time axis that is not a date is
 * expressed in calendar days derived from the row dates.
 *
 * Output files (all one element per line, floats rounded to ≤ 6 significant
 * digits): daily.json, monthly-returns.json, ytd-roi.json, ta.json,
 * events.json, days-since.json, distributions.json, fan.json, event-roi.json,
 * roi-bands.json, plus fan-params.json (the cached quantile-fan fit).
 */
import fs from "node:fs";
import path from "node:path";
import type { AssetDef } from "./assets";
import type { DailySeries } from "./marketData";
import { CYCLE_THRESHOLDS, detectCycles, milestoneLevels } from "./cycles";
import {
  averageDailyReturns,
  benford,
  bollinger,
  crossDates,
  dayNumber,
  daysBetween,
  daysSinceMoveByDate,
  daysToMultipleByDate,
  ema,
  eventRoiByDate,
  fanPredictor,
  fanPosition,
  fitLogRegression,
  macd,
  milestoneCrossings,
  monthlyReturns,
  quantileFanParams,
  quarterlyReturns,
  riskMetric,
  rollingVolatility,
  roundSig,
  rsi,
  sma,
  supertrend,
  W,
  type EventRoiPath,
  type FanParams,
} from "./metrics";

/** Minimum days-since-origin of the first row on the fan's log-time axis. */
export const MIN_START_DAYS = 365;

export const TAUS = [0.01, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 0.99];
const FAN_ITERS = 4000;
/** Length of the quantile-fan refit rota, in calendar days. See `fanRefitDue`. */
export const FAN_REFIT_DAYS = 28;
const DS_THRESHOLDS = [5, 10, 20];
const MULTIPLES = [2, 4, 10, 100];

/**
 * Calendar-day cap on an event-anchored ROI path. Four years covers a whole
 * crypto cycle, which is where the 1460 came from; equity and index cycles run
 * far longer (the S&P 500 took eleven years from the 2009 bottom to the 2020
 * top), and the crypto cap froze those charts mid-path — CAT's 2020-03-23
 * bottom stopped advancing on 2024-03-22, and SPX's 2022-10-12 bottom would
 * have stopped on 2026-10-11. Ten years clears every completed equity cycle in
 * the registry.
 */
const ROI_CAP_DAYS: Record<string, number> = { crypto: 1460, stablecoin: 1460 };
const ROI_CAP_DAYS_DEFAULT = 3650;

export interface ComputeOptions {
  /** Refit the quantile fan even if a fresh fan-params.json exists. */
  refit?: boolean;
  /** Print progress and a summary line. */
  log?: boolean;
  /** Override the metrics root (default: <cwd>/data/metrics). */
  outDir?: string;
}

export interface ComputeSummary {
  id: string;
  rows: number;
  through: string;
  close: number;
  fair: number | null;
  risk: number | null;
  mayer: number | null;
  rsi14: number | null;
  peaks: string[];
  bottoms: string[];
  fanRefit: boolean;
}

interface FanCache extends FanParams {
  fittedThrough: string;
  /** Close on `fittedThrough` at fit time; a rewrite of the recent tail changes it. */
  fittedThroughClose: number;
  firstDate: string;
  /** Close on `firstDate` at fit time; a split rewrites every close, including this one. */
  firstClose: number;
  origin: string;
  originShift: number;
  iters: number;
}

/** Stable 32-bit FNV-1a hash — only used to pick an asset's slot in the refit rota. */
function idHash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Whether a cached fan fit is due to be refitted for `lastDate`.
 *
 * A refit rewrites every fitted number in daily.json, fan.json and
 * distributions.json. Measured across the 32 full-suite assets that is ~15 MB
 * compressed added to the repo on a day they all refit, against ~90 KB on a
 * day that only appends bars — and the fit barely moves over a month of new
 * rows. So each asset refits once per `FAN_REFIT_DAYS` on a slot derived from
 * its id, which spreads the cost evenly across the window instead of spiking
 * it. `age >= FAN_REFIT_DAYS` is the backstop for an asset whose slot day was
 * missed (a failed cron run); `--refit` forces every asset regardless.
 */
export function fanRefitDue(id: string, fittedThrough: string, lastDate: string): boolean {
  const age = daysBetween(fittedThrough, lastDate);
  if (age < 0) return true; // cache claims a date past the data: distrust it
  if (age === 0) return false; // already fitted through this exact date
  if (age >= FAN_REFIT_DAYS) return true;
  return dayNumber(lastDate) % FAN_REFIT_DAYS === idHash(id) % FAN_REFIT_DAYS;
}

/** Percent/ratio style rounding: fixed decimals, then capped at 6 significant digits. */
function fix(v: number | null | undefined, decimals: number): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  return roundSig(Number(v.toFixed(decimals)));
}

/** Price-style rounding: 6 significant digits. */
const px = (v: number | null | undefined): number | null => roundSig(v);

/**
 * JSON with one element per line for arrays of objects/arrays and for long
 * primitive arrays, so daily regenerations diff as appended lines. Flat
 * objects stay on one line. No indentation (keeps large files small).
 */
export function jsonLines(v: unknown): string {
  const isPrimitive = (x: unknown) => x === null || typeof x !== "object";
  const isFlat = (x: unknown): boolean => {
    if (isPrimitive(x)) return true;
    if (Array.isArray(x)) return x.length <= 32 && x.every(isPrimitive);
    return Object.values(x as Record<string, unknown>).every(
      (val) => isPrimitive(val) || (Array.isArray(val) && val.length <= 32 && val.every(isPrimitive)),
    );
  };
  const ser = (x: unknown): string => {
    if (isPrimitive(x)) return JSON.stringify(x);
    if (Array.isArray(x)) {
      if (x.length === 0) return "[]";
      if (x.length <= 32 && x.every(isPrimitive)) return JSON.stringify(x);
      return `[\n${x.map(ser).join(",\n")}\n]`;
    }
    if (isFlat(x)) return JSON.stringify(x);
    const entries = Object.entries(x as Record<string, unknown>).filter(([, val]) => val !== undefined);
    return `{\n${entries.map(([k, val]) => `${JSON.stringify(k)}: ${ser(val)}`).join(",\n")}\n}`;
  };
  return `${ser(v)}\n`;
}

function writeJson(dir: string, name: string, v: unknown): void {
  fs.writeFileSync(path.join(dir, name), jsonLines(v));
}

function loadFanCache(file: string): FanCache | null {
  if (!fs.existsSync(file)) return null;
  try {
    const c = JSON.parse(fs.readFileSync(file, "utf8")) as FanCache;
    if (!c || !Array.isArray(c.coeffs) || !c.norm || !Array.isArray(c.taus)) return null;
    return c;
  } catch {
    return null;
  }
}

export function computeAsset(def: AssetDef, series: DailySeries, opts: ComputeOptions = {}): ComputeSummary {
  const log = (msg: string) => {
    if (opts.log) console.log(`[${def.id}] ${msg}`);
  };
  const rows = series.rows;
  if (rows.length < 2) throw new Error(`${def.id}: not enough rows`);
  const ppy = def.periodsPerYear;
  const win = W(ppy);
  const closes = rows.map((r) => r.close);
  const dates = rows.map((r) => r.date);
  const lastDate = dates[dates.length - 1];

  // Time axis for log-time regressions: calendar days since the asset's origin.
  // The first row must not sit near t = 1 (ln t = 0), where z is a far-left
  // outlier that the quadratic term amplifies into a nonsense fair value — so
  // the axis is shifted until the first row is at least MIN_START_DAYS out.
  // One year puts an IPO-dated listing in the same ln(t) regime as BTC, whose
  // first row is 592 days past its 2009-01-03 genesis (a 30-day floor left
  // SPX's first rows with a fair value ~120x the close). The shift keys off
  // the actual gap, not off whether `origin` was declared. Assets whose data
  // starts well after their origin get no shift at all.
  const origin = def.origin ?? rows[0].date;
  const originShift = Math.max(0, MIN_START_DAYS - daysBetween(origin, rows[0].date));
  const days = dates.map((d) => Math.max(1, daysBetween(origin, d) + originShift));

  const reg = fitLogRegression(days, closes);

  // --- asymmetric quantile-regression fan (cached fit) -----------------------
  const dir = path.join(opts.outDir ?? path.join(process.cwd(), "data", "metrics"), def.id);
  fs.mkdirSync(dir, { recursive: true });
  const cacheFile = path.join(dir, "fan-params.json");
  const cached = opts.refit ? null : loadFanCache(cacheFile);
  // The fingerprint must cover anything that changes the fitted numbers, not
  // just the fit's age: a split rewrites every close in the file while leaving
  // firstDate, origin, taus and iters untouched, and reusing the pre-split fit
  // scales fair/bandLow/bandHigh/riskLevels by the split factor.
  const fittedThroughClose = cached
    ? rows.find((r) => r.date === cached.fittedThrough)?.close
    : undefined;
  const cacheFresh =
    cached !== null &&
    cached.firstDate === rows[0].date &&
    cached.firstClose === closes[0] &&
    fittedThroughClose !== undefined &&
    cached.fittedThroughClose === fittedThroughClose &&
    cached.origin === origin &&
    cached.originShift === originShift &&
    cached.iters === FAN_ITERS &&
    cached.taus.length === TAUS.length &&
    cached.taus.every((t, i) => t === TAUS[i]) &&
    !fanRefitDue(def.id, cached.fittedThrough, lastDate);
  let params: FanParams;
  let fanRefit = false;
  if (cacheFresh && cached) {
    params = cached;
    log(`fan: reusing fit through ${cached.fittedThrough}`);
  } else {
    log("fan: fitting quantile regression…");
    params = quantileFanParams(days, closes, TAUS, FAN_ITERS);
    fanRefit = true;
    const cache: FanCache = {
      fittedThrough: lastDate,
      fittedThroughClose: closes[closes.length - 1],
      firstDate: rows[0].date,
      firstClose: closes[0],
      origin,
      originShift,
      iters: FAN_ITERS,
      taus: TAUS,
      norm: params.norm,
      coeffs: params.coeffs,
    };
    fs.writeFileSync(cacheFile, `${JSON.stringify(cache, null, 1)}\n`);
  }
  const predict = fanPredictor(params);
  const fanRows = days.map((t) => TAUS.map((_, k) => predict(t, k)));
  const fairs = fanRows.map((levels) => levels[Math.floor(TAUS.length / 2)]);
  const risk = closes.map((c, i) => (i < win.y1 ? null : fanPosition(c, fanRows[i], TAUS)));

  // --- moving averages -------------------------------------------------------
  const sma20w = sma(closes, win.w20);
  const ema21w = ema(closes, win.w21ema);
  const sma50w = sma(closes, win.w50);
  const sma200w = sma(closes, win.w200);
  const sma200d = sma(closes, win.d200);
  const sma50d = sma(closes, win.d50);
  const rsi14 = rsi(closes, 14);

  const daily = rows.map((r, i) => ({
    date: r.date,
    close: r.close,
    fair: px(fairs[i]),
    bandLow: px(fanRows[i][3]), // τ=0.30
    bandHigh: px(fanRows[i][5]), // τ=0.70
    risk: fix(risk[i], 3),
    sma20w: px(sma20w[i]),
    ema21w: px(ema21w[i]),
    sma50w: px(sma50w[i]),
    sma200w: px(sma200w[i]),
    mayer: fix(sma200d[i] === null ? null : closes[i] / sma200d[i]!, 3),
    rsi14: fix(rsi14[i], 1),
    roi1y: fix(i < win.y1 ? null : (closes[i] / closes[i - win.y1] - 1) * 100, 1),
  }));
  writeJson(dir, "daily.json", {
    updatedThrough: lastDate,
    regression: { slope: reg.slope, intercept: reg.intercept, sigma: reg.sigma },
    rows: daily,
  });

  writeJson(
    dir,
    "monthly-returns.json",
    monthlyReturns(rows).map((m) => ({ ...m, pct: roundSig(m.pct)! })),
  );

  // --- YTD ROI: per-year % since that year's first close, keyed by MM-DD ----
  const byYear = new Map<number, { md: string; pct: number }[]>();
  let curYear = 0;
  let yearBase = 0;
  for (const r of rows) {
    const y = Number(r.date.slice(0, 4));
    if (y !== curYear) {
      curYear = y;
      yearBase = r.close;
      byYear.set(y, []);
    }
    byYear.get(y)!.push({ md: r.date.slice(5), pct: fix((r.close / yearBase - 1) * 100, 1)! });
  }
  writeJson(
    dir,
    "ytd-roi.json",
    [...byYear.entries()].map(([year, points]) => ({ year, points })),
  );

  // --- TA family -------------------------------------------------------------
  const { macd: macdLine, signal: macdSignal, hist: macdHist } = macd(closes);
  const bb = bollinger(closes);
  const vol30 = rollingVolatility(closes, 30);
  const vol60 = rollingVolatility(closes, 60);
  const vol180 = rollingVolatility(closes, 180);
  const sma111d = sma(closes, win.pi111);
  const sma350x2 = sma(closes, win.pi350).map((v) => (v === null ? null : v * 2));

  // short-term bubble risk: percentile-ranked extension from the 20W SMA
  const bubbleStart = sma20w.findIndex((v) => v !== null);
  const bubble: (number | null)[] =
    bubbleStart === -1
      ? new Array(rows.length).fill(null)
      : new Array<number | null>(bubbleStart)
          .fill(null)
          .concat(
            riskMetric(
              closes.slice(bubbleStart),
              sma20w.slice(bubbleStart) as number[],
              win.risk.window,
              win.risk.warmup,
            ),
          );

  // Supertrend needs a real intraday range: its band is an ATR around (high +
  // low)/2, and a close-only source collapses every bar to high == low ==
  // close, leaving zero true range. Rather than substitute a close-to-close
  // range and label the result Supertrend, such a series is skipped and
  // stUp/stDown stay null on every row — which the chart already renders as a
  // gap, the same way it does for BTC's first 2,556 close-only rows. Cboe's
  // SPX history is the one live case.
  const ohlcStart = rows.findIndex((r) => r.high !== r.low);
  if (ohlcStart === -1) log("supertrend: close-only series (high == low on every bar); stUp/stDown left null");
  const st = ohlcStart === -1 ? [] : supertrend(rows.slice(ohlcStart));
  const stAt = (i: number) => (ohlcStart === -1 || i < ohlcStart ? null : st[i - ohlcStart]);

  let ath = 0;
  const ta = rows.map((r, i) => {
    ath = Math.max(ath, r.close);
    const s = stAt(i);
    return {
      date: r.date,
      close: r.close,
      drawdown: fix((r.close / ath - 1) * 100, 1),
      vol30: fix(vol30[i], 2),
      vol60: fix(vol60[i], 2),
      vol180: fix(vol180[i], 2),
      macd: px(macdLine[i]),
      macdSignal: px(macdSignal[i]),
      macdHist: px(macdHist[i]),
      bbUpper: px(bb.upper[i]),
      bbMid: px(bb.mid[i]),
      bbLower: px(bb.lower[i]),
      sma50d: px(sma50d[i]),
      sma200d: px(sma200d[i]),
      sma111d: px(sma111d[i]),
      sma350x2: px(sma350x2[i]),
      bubble: fix(bubble[i], 3),
      stUp: s && s.up ? px(s.value) : null,
      stDown: s && !s.up ? px(s.value) : null,
    };
  });
  writeJson(dir, "ta.json", { rows: ta });

  // --- events: MA crosses ----------------------------------------------------
  writeJson(dir, "events.json", {
    goldenDeath: crossDates(dates, sma50d, sma200d),
    piCycle: crossDates(dates, sma111d, sma350x2),
  });

  // --- calendar days since ±X% single-period moves ---------------------------
  writeJson(dir, "days-since.json", {
    declines: DS_THRESHOLDS.map((t) => ({
      threshold: t,
      days: daysSinceMoveByDate(dates, closes, t, "decline"),
    })),
    gains: DS_THRESHOLDS.map((t) => ({
      threshold: t,
      days: daysSinceMoveByDate(dates, closes, t, "gain"),
    })),
    dates,
  });

  // --- cycles ----------------------------------------------------------------
  const cycles =
    def.cycles ?? detectCycles(rows, CYCLE_THRESHOLDS[def.class] ?? CYCLE_THRESHOLDS.crypto);
  const peakDates = [...cycles.peaks].sort();
  const bottomDates = [...cycles.bottoms].sort();

  // --- fan curves for the chart (thinned to every 3rd row) -------------------
  writeJson(dir, "fan.json", {
    taus: TAUS,
    rows: rows
      .map((r, i) => ({ date: r.date, q: fanRows[i].map((v) => px(v)!) }))
      .filter((_, i) => i % 3 === 0 || i === rows.length - 1),
  });

  // --- event-anchored ROI paths + cycle deviation ----------------------------
  const capDays = ROI_CAP_DAYS[def.class] ?? ROI_CAP_DAYS_DEFAULT;
  const bottoms = eventRoiByDate(rows, bottomDates, capDays);
  const peaks = eventRoiByDate(rows, peakDates, capDays);
  const athIdx = closes.reduce((best, c, i) => (c > closes[best] ? i : best), 0);
  const latestPeak = eventRoiByDate(rows, [rows[athIdx].date], 100000);
  const halvings = def.halvings ? eventRoiByDate(rows, def.halvings, capDays) : undefined;
  // current cycle ROI vs the average of prior cycles at the same calendar-day
  // count; a prior cycle that lasted at least that long contributes its latest
  // point at or before that day (exact match on gap-free daily series).
  const current = bottoms.at(-1);
  const priors = bottoms.slice(0, -1);
  const deviation: { day: number; pct: number }[] = [];
  if (current && priors.length > 0) {
    const cursors = priors.map(() => 0);
    for (const { day, pct } of current.points) {
      const at: number[] = [];
      priors.forEach((c, k) => {
        if (c.points.length === 0 || day > c.points[c.points.length - 1].day) return;
        while (cursors[k] + 1 < c.points.length && c.points[cursors[k] + 1].day <= day) cursors[k]++;
        const p = c.points[cursors[k]];
        if (p.day <= day) at.push(p.pct);
      });
      if (at.length === 0) continue;
      deviation.push({ day, pct: fix(pct - at.reduce((a, b) => a + b, 0) / at.length, 1)! });
    }
  }
  const eventRoiOut: {
    halvings?: EventRoiPath[];
    bottoms: EventRoiPath[];
    peaks: EventRoiPath[];
    latestPeak: EventRoiPath[];
    deviation: { day: number; pct: number }[];
  } = { bottoms, peaks, latestPeak, deviation };
  if (halvings) eventRoiOut.halvings = halvings;
  writeJson(dir, "event-roi.json", halvings ? { halvings, ...eventRoiOut } : eventRoiOut);

  // --- ROI bands: calendar days until each buy N-times'd ---------------------
  writeJson(
    dir,
    "roi-bands.json",
    MULTIPLES.map((m) => ({ multiple: m, days: daysToMultipleByDate(dates, closes, m) })),
  );

  // --- distributions & aggregates -------------------------------------------
  const todayLevels = fanRows[fanRows.length - 1];
  const lnLv = todayLevels.map(Math.log);
  const priceAtRisk = (r: number): number => {
    if (r <= TAUS[0]) return todayLevels[0];
    if (r >= TAUS[TAUS.length - 1]) return todayLevels[TAUS.length - 1];
    for (let i = 1; i < TAUS.length; i++) {
      if (r <= TAUS[i]) {
        const f = (r - TAUS[i - 1]) / (TAUS[i] - TAUS[i - 1]);
        return Math.exp(lnLv[i - 1] + f * (lnLv[i] - lnLv[i - 1]));
      }
    }
    return todayLevels[TAUS.length - 1];
  };
  const riskLevels = Array.from({ length: 9 }, (_, i) => {
    const r = (i + 1) / 10;
    return { risk: r, price: px(priceAtRisk(r))! };
  });

  // best day to DCA: average extension from the 50d SMA per weekday
  const extByDow: number[][] = Array.from({ length: 7 }, () => []);
  rows.forEach((r, i) => {
    if (sma50d[i] === null) return;
    extByDow[new Date(`${r.date}T00:00:00Z`).getUTCDay()].push(Math.log(r.close / sma50d[i]!) * 100);
  });
  // weekdays with no rows (weekends for exchange-traded assets) are omitted
  const dcaWeekday = extByDow
    .map((vals, dow) => ({ dow, vals }))
    .filter(({ vals }) => vals.length > 0)
    .map(({ dow, vals }) => ({
      dow,
      avgExt: fix(vals.reduce((a, b) => a + b, 0) / vals.length, 3)!,
    }));

  // 20W SMA crossing the previous cycle top
  const peakCloses = peakDates
    .map((d) => ({ date: d, idx: rows.findIndex((r) => r.date >= d) }))
    .filter((p) => p.idx !== -1)
    .map((p) => ({ date: p.date, idx: p.idx, close: closes[p.idx] }));
  const breakouts: { date: string; prevTop: number }[] = [];
  for (let p = 0; p < peakCloses.length; p++) {
    const from = peakCloses[p].idx;
    const until = p + 1 < peakCloses.length ? peakCloses[p + 1].idx : rows.length;
    for (let i = from + 1; i < until; i++) {
      if (
        sma20w[i] !== null &&
        sma20w[i - 1] !== null &&
        sma20w[i - 1]! < peakCloses[p].close &&
        sma20w[i]! >= peakCloses[p].close
      ) {
        breakouts.push({ date: rows[i].date, prevTop: px(peakCloses[p].close)! });
        break;
      }
    }
  }

  const milestones = milestoneLevels(closes);
  writeJson(dir, "distributions.json", {
    benford: benford(closes).map((b) => ({
      digit: b.digit,
      actual: roundSig(b.actual)!,
      expected: roundSig(b.expected)!,
    })),
    milestoneLevels: milestones,
    milestones: milestoneCrossings(dates, closes, milestones),
    quarterly: quarterlyReturns(rows).map((q) => ({ ...q, pct: fix(q.pct, 1)! })),
    avgDaily: averageDailyReturns(rows).map((d) => ({ ...d, avg: fix(d.avg, 3)! })),
    riskLevels,
    dcaWeekday,
    smaTopBreakouts: breakouts,
    cyclePeaks: peakDates,
    cycleBottoms: bottomDates,
  });

  const latest = daily[daily.length - 1];
  log(
    `${def.symbol} through ${latest.date}: close=${latest.close} fair=${latest.fair} risk=${latest.risk} mayer=${latest.mayer} rsi=${latest.rsi14} peaks=${peakDates.length} bottoms=${bottomDates.length}`,
  );
  return {
    id: def.id,
    rows: rows.length,
    through: latest.date,
    close: latest.close,
    fair: latest.fair,
    risk: latest.risk,
    mayer: latest.mayer,
    rsi14: latest.rsi14,
    peaks: peakDates,
    bottoms: bottomDates,
    fanRefit,
  };
}
