/**
 * Derives all metric series from raw data → data/metrics/<asset>/.
 * Rerun any time formulas change; raw data is never touched.
 * Weekly MAs are approximated on daily closes (20W ≈ 140d, 21W ≈ 147d, etc.).
 */
import fs from "node:fs";
import path from "node:path";
import { readSeries } from "./lib/marketData";
import {
  averageDailyReturns,
  benford,
  bollinger,
  crossDates,
  daysSinceMove,
  daysToMultiple,
  ema,
  eventRoi,
  fitLogRegression,
  macd,
  milestoneCrossings,
  monthlyReturns,
  quarterlyReturns,
  riskMetric,
  rollingVolatility,
  rsi,
  sma,
  supertrend,
} from "./lib/metrics";

const HALVINGS = ["2012-11-28", "2016-07-09", "2020-05-11", "2024-04-19"];
const CYCLE_BOTTOMS = ["2011-11-18", "2015-01-14", "2018-12-15", "2022-11-21"];
const CYCLE_PEAKS = ["2011-06-08", "2013-11-30", "2017-12-17", "2021-11-10"];

const BTC_GENESIS = Date.parse("2009-01-03T00:00:00Z");
const DAY_MS = 86_400_000;

function round(v: number | null, digits: number): number | null {
  return v === null ? null : Number(v.toFixed(digits));
}

function main() {
  const series = readSeries("BTC");
  if (!series) throw new Error("Run `npm run data:backfill` first.");
  const rows = series.rows;
  const closes = rows.map((r) => r.close);
  const days = rows.map(
    (r) => (Date.parse(`${r.date}T00:00:00Z`) - BTC_GENESIS) / DAY_MS,
  );

  const reg = fitLogRegression(days, closes);
  const fairs = days.map((t) => reg.fair(t));
  const risk = riskMetric(closes, fairs);
  const sma20w = sma(closes, 140);
  const ema21w = ema(closes, 147);
  const sma50w = sma(closes, 350);
  const sma200w = sma(closes, 1400);
  const sma200d = sma(closes, 200);
  const rsi14 = rsi(closes, 14);

  const daily = rows.map((r, i) => ({
    date: r.date,
    close: r.close,
    fair: round(fairs[i], 2),
    bandLow: round(fairs[i] * Math.exp(-reg.sigma), 2),
    bandHigh: round(fairs[i] * Math.exp(reg.sigma), 2),
    risk: round(risk[i], 3),
    sma20w: round(sma20w[i], 2),
    ema21w: round(ema21w[i], 2),
    sma50w: round(sma50w[i], 2),
    sma200w: round(sma200w[i], 2),
    mayer: round(sma200d[i] === null ? null : closes[i] / sma200d[i]!, 3),
    rsi14: round(rsi14[i], 1),
    roi1y: round(i < 365 ? null : (closes[i] / closes[i - 365] - 1) * 100, 1),
  }));

  const dir = path.join(process.cwd(), "data", "metrics", "btc");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "daily.json"),
    `{\n"updatedThrough": ${JSON.stringify(rows.at(-1)!.date)},\n"regression": ${JSON.stringify(
      { slope: reg.slope, intercept: reg.intercept, sigma: reg.sigma },
    )},\n"rows": [\n${daily.map((d) => JSON.stringify(d)).join(",\n")}\n]\n}\n`,
  );
  fs.writeFileSync(
    path.join(dir, "monthly-returns.json"),
    JSON.stringify(monthlyReturns(rows)),
  );

  // YTD ROI: per-year % return since that year's first close, keyed by MM-DD
  // so different years can overlay on a shared Jan–Dec axis.
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
    byYear.get(y)!.push({
      md: r.date.slice(5),
      pct: Number(((r.close / yearBase - 1) * 100).toFixed(1)),
    });
  }
  const ytd = [...byYear.entries()].map(([year, points]) => ({ year, points }));
  fs.writeFileSync(path.join(dir, "ytd-roi.json"), JSON.stringify(ytd));

  // --- TA family: per-day technicals in their own file so pages load only what they need
  const dates = rows.map((r) => r.date);
  const { macd: macdLine, signal: macdSignal, hist: macdHist } = macd(closes);
  const bb = bollinger(closes);
  const vol30 = rollingVolatility(closes, 30);
  const vol60 = rollingVolatility(closes, 60);
  const vol180 = rollingVolatility(closes, 180);
  const sma50d = sma(closes, 50);
  const sma111d = sma(closes, 111);
  const sma350x2 = sma(closes, 350).map((v) => (v === null ? null : v * 2));

  // short-term bubble risk: percentile-ranked extension from the 20W SMA
  const bubbleStart = sma20w.findIndex((v) => v !== null);
  const bubbleTail = riskMetric(
    closes.slice(bubbleStart),
    sma20w.slice(bubbleStart) as number[],
  );
  const bubble = new Array(bubbleStart).fill(null).concat(bubbleTail);

  // supertrend needs true OHLC — Binance era only
  const ohlcStart = rows.findIndex((r) => r.date >= "2017-08-17");
  const st = supertrend(rows.slice(ohlcStart));

  let ath = 0;
  const ta = rows.map((r, i) => {
    ath = Math.max(ath, r.close);
    return {
      date: r.date,
      close: r.close,
      drawdown: round((r.close / ath - 1) * 100, 1),
      vol30: round(vol30[i], 2),
      vol60: round(vol60[i], 2),
      vol180: round(vol180[i], 2),
      macd: round(macdLine[i], 2),
      macdSignal: round(macdSignal[i], 2),
      macdHist: round(macdHist[i], 2),
      bbUpper: round(bb.upper[i], 2),
      bbMid: round(bb.mid[i], 2),
      bbLower: round(bb.lower[i], 2),
      sma50d: round(sma50d[i], 2),
      sma200d: round(sma200d[i], 2),
      sma111d: round(sma111d[i], 2),
      sma350x2: round(sma350x2[i], 2),
      bubble: round(bubble[i] ?? null, 3),
      stUp: i >= ohlcStart && st[i - ohlcStart].up ? round(st[i - ohlcStart].value, 2) : null,
      stDown: i >= ohlcStart && !st[i - ohlcStart].up ? round(st[i - ohlcStart].value, 2) : null,
    };
  });
  fs.writeFileSync(
    path.join(dir, "ta.json"),
    `{\n"rows": [\n${ta.map((d) => JSON.stringify(d)).join(",\n")}\n]\n}\n`,
  );

  // --- events: MA crosses
  fs.writeFileSync(
    path.join(dir, "events.json"),
    JSON.stringify({
      goldenDeath: crossDates(dates, sma50d, sma200d),
      piCycle: crossDates(dates, sma111d, sma350x2),
    }),
  );

  // --- days since ±X% daily moves
  const DS_THRESHOLDS = [5, 10, 20];
  fs.writeFileSync(
    path.join(dir, "days-since.json"),
    JSON.stringify({
      declines: DS_THRESHOLDS.map((t) => ({
        threshold: t,
        days: daysSinceMove(closes, t, "decline"),
      })),
      gains: DS_THRESHOLDS.map((t) => ({
        threshold: t,
        days: daysSinceMove(closes, t, "gain"),
      })),
      dates,
    }),
  );

  // --- distributions & aggregates
  const MILESTONES = [1, 10, 100, 1000, 10000, 20000, 30000, 50000, 75000, 100000, 125000];
  fs.writeFileSync(
    path.join(dir, "distributions.json"),
    JSON.stringify({
      benford: benford(closes),
      milestones: milestoneCrossings(dates, closes, MILESTONES),
      quarterly: quarterlyReturns(rows).map((q) => ({ ...q, pct: Number(q.pct.toFixed(1)) })),
      avgDaily: averageDailyReturns(rows).map((d) => ({ ...d, avg: Number(d.avg.toFixed(3)) })),
    }),
  );

  // --- event-anchored ROI paths + cycle deviation
  const halvings = eventRoi(rows, HALVINGS);
  const bottoms = eventRoi(rows, CYCLE_BOTTOMS);
  const peaks = eventRoi(rows, CYCLE_PEAKS);
  const athIdx = closes.indexOf(Math.max(...closes));
  const latestPeak = eventRoi(rows, [rows[athIdx].date], 100000);
  // current cycle ROI vs the average of prior cycles at the same day-count
  const current = bottoms.at(-1)!;
  const priors = bottoms.slice(0, -1);
  const deviation = current.points.map(({ day, pct }) => {
    const at = priors
      .map((c) => c.points[day]?.pct)
      .filter((v): v is number => v !== undefined);
    if (at.length === 0) return null;
    return { day, pct: Number((pct - at.reduce((a, b) => a + b, 0) / at.length).toFixed(1)) };
  }).filter((p): p is { day: number; pct: number } => p !== null);
  fs.writeFileSync(
    path.join(dir, "event-roi.json"),
    JSON.stringify({ halvings, bottoms, peaks, latestPeak, deviation }),
  );

  // --- ROI bands: days until each buy N-times'd
  const MULTIPLES = [2, 4, 10, 100];
  fs.writeFileSync(
    path.join(dir, "roi-bands.json"),
    JSON.stringify(
      MULTIPLES.map((m) => ({
        multiple: m,
        days: daysToMultiple(closes, m),
      })).map((b) => ({ ...b })),
    ),
  );

  // --- current risk levels: window quantiles of ln-deviation mapped back to price
  const dLn = closes.map((c, i) => Math.log(c / fairs[i]));
  const win = dLn.slice(-1460).sort((a, b) => a - b);
  const q = (p: number) => win[Math.min(win.length - 1, Math.floor(p * win.length))];
  const fairNow = fairs[fairs.length - 1];
  const riskLevels = Array.from({ length: 9 }, (_, i) => {
    const r = (i + 1) / 10;
    return { risk: r, price: Number((fairNow * Math.exp(q(r))).toFixed(0)) };
  });

  // --- best day to DCA: average extension from 50d SMA per weekday
  const extByDow: number[][] = Array.from({ length: 7 }, () => []);
  rows.forEach((r, i) => {
    if (sma50d[i] === null) return;
    extByDow[new Date(`${r.date}T00:00:00Z`).getUTCDay()].push(
      Math.log(r.close / sma50d[i]!) * 100,
    );
  });
  const dcaWeekday = extByDow.map((vals, dow) => ({
    dow,
    avgExt: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
  }));

  // --- 20W SMA crossing previous cycle top
  const peakCloses = CYCLE_PEAKS.map((d) => {
    const i = rows.findIndex((r) => r.date >= d);
    return { date: d, close: closes[i] };
  });
  const breakouts: { date: string; prevTop: number }[] = [];
  for (let p = 0; p < peakCloses.length; p++) {
    const from = rows.findIndex((r) => r.date >= peakCloses[p].date);
    const until = p + 1 < peakCloses.length ? rows.findIndex((r) => r.date >= peakCloses[p + 1].date) : rows.length;
    for (let i = from + 1; i < until; i++) {
      if (sma20w[i] !== null && sma20w[i - 1] !== null &&
          sma20w[i - 1]! < peakCloses[p].close && sma20w[i]! >= peakCloses[p].close) {
        breakouts.push({ date: rows[i].date, prevTop: peakCloses[p].close });
        break;
      }
    }
  }

  const dist = JSON.parse(fs.readFileSync(path.join(dir, "distributions.json"), "utf8"));
  fs.writeFileSync(
    path.join(dir, "distributions.json"),
    JSON.stringify({
      ...dist,
      riskLevels,
      dcaWeekday,
      smaTopBreakouts: breakouts,
      cyclePeaks: CYCLE_PEAKS,
    }),
  );

  const latest = daily.at(-1)!;
  console.log(
    `BTC metrics through ${latest.date}: close=$${latest.close} fair=$${latest.fair} risk=${latest.risk} mayer=${latest.mayer} rsi=${latest.rsi14}`,
  );
}

main();
