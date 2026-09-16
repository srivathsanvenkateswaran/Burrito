import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { computeAsset, fanRefitDue, FAN_REFIT_DAYS } from "../scripts/lib/computeAsset";
import type { AssetDef } from "../scripts/lib/assets";
import type { DailySeries, DailyRow } from "../scripts/lib/marketData";

/** Deterministic PRNG (mulberry32) so the synthetic series is reproducible. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSyntheticSeries(rowCount: number): DailySeries {
  const rand = mulberry32(42);
  const rows: DailyRow[] = [];
  let close = 100;
  const date = new Date(Date.UTC(2020, 0, 1));
  for (let i = 0; i < rowCount; i++) {
    // Skip weekends to look like a real trading calendar.
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() + 1);
    // Geometric random walk: daily log-return ~ N(0, 0.02) via Box-Muller.
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    close = close * Math.exp(0.0003 + 0.02 * z);
    const open = close * (1 + (rand() - 0.5) * 0.01);
    const high = Math.max(open, close) * (1 + rand() * 0.005);
    const low = Math.min(open, close) * (1 - rand() * 0.005);
    rows.push({
      date: date.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volumeUsd: 1_000_000 + rand() * 500_000,
    });
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return { asset: "TEST", quote: "USD", updatedAt: `${rows[rows.length - 1].date}T00:00:00.000Z`, rows };
}

const ROW_COUNT = 800;

const def: AssetDef = {
  id: "test-equity",
  symbol: "TEST",
  name: "Test Equity",
  class: "equity",
  suite: "full",
  sector: "Test",
  about: "Synthetic series for computeAsset integration tests.",
  price: { kind: "none" },
  quote: "USD",
  periodsPerYear: 252,
};

describe("computeAsset (integration, synthetic 800-row series)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "burrito-computeasset-"));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const series = buildSyntheticSeries(ROW_COUNT);
  const outDir = path.join(tmpDir, "metrics");
  const summary = computeAsset(def, series, { outDir });
  const dir = path.join(outDir, def.id);

  const EXPECTED_FILES = [
    "daily.json",
    "monthly-returns.json",
    "ytd-roi.json",
    "ta.json",
    "events.json",
    "days-since.json",
    "distributions.json",
    "fan.json",
    "event-roi.json",
    "roi-bands.json",
    "fan-params.json",
  ];

  test("writes all 10 metric files plus fan-params.json", () => {
    for (const name of EXPECTED_FILES) {
      assert.ok(fs.existsSync(path.join(dir, name)), `missing ${name}`);
    }
  });

  test("daily.json has one row per input row", () => {
    const daily = JSON.parse(fs.readFileSync(path.join(dir, "daily.json"), "utf8"));
    assert.equal(daily.rows.length, ROW_COUNT);
    assert.equal(daily.updatedThrough, series.rows[series.rows.length - 1].date);
  });

  test("risk is either null or within [0, 1]", () => {
    const daily = JSON.parse(fs.readFileSync(path.join(dir, "daily.json"), "utf8"));
    for (const row of daily.rows) {
      assert.ok(row.risk === null || (row.risk >= 0 && row.risk <= 1), `risk out of range: ${row.risk}`);
    }
    // First year (periodsPerYear=252 rows) has no risk yet.
    assert.equal(daily.rows[0].risk, null);
  });

  test("ta.json: sma200d is non-null well after row 200", () => {
    const ta = JSON.parse(fs.readFileSync(path.join(dir, "ta.json"), "utf8"));
    assert.equal(ta.rows[100].sma200d, null);
    assert.ok(ta.rows[300].sma200d !== null && ta.rows[300].sma200d > 0);
  });

  test("events.json, days-since.json and roi-bands.json parse with the expected shape", () => {
    const events = JSON.parse(fs.readFileSync(path.join(dir, "events.json"), "utf8"));
    assert.ok(Array.isArray(events.goldenDeath));
    assert.ok(Array.isArray(events.piCycle));

    const daysSince = JSON.parse(fs.readFileSync(path.join(dir, "days-since.json"), "utf8"));
    assert.ok(Array.isArray(daysSince.declines) && daysSince.declines.length === 3);
    assert.ok(Array.isArray(daysSince.gains) && daysSince.gains.length === 3);
    assert.equal(daysSince.dates.length, ROW_COUNT);

    const roiBands = JSON.parse(fs.readFileSync(path.join(dir, "roi-bands.json"), "utf8"));
    assert.equal(roiBands.length, 4);
    for (const band of roiBands) {
      assert.ok(typeof band.multiple === "number");
      assert.equal(band.days.length, ROW_COUNT);
    }
  });

  test("event-roi.json parses (bottoms/peaks/latestPeak/deviation)", () => {
    const eventRoi = JSON.parse(fs.readFileSync(path.join(dir, "event-roi.json"), "utf8"));
    assert.ok(Array.isArray(eventRoi.bottoms));
    assert.ok(Array.isArray(eventRoi.peaks));
    assert.ok(Array.isArray(eventRoi.latestPeak));
    assert.ok(Array.isArray(eventRoi.deviation));
  });

  test("summary reflects a fresh fit on the first run", () => {
    assert.equal(summary.id, "test-equity");
    assert.equal(summary.rows, ROW_COUNT);
    assert.equal(summary.fanRefit, true);
  });

  test("a second run without refit reuses the cached fan-params.json", () => {
    const cacheFile = path.join(dir, "fan-params.json");
    const before = fs.readFileSync(cacheFile, "utf8");
    const mtimeBefore = fs.statSync(cacheFile).mtimeMs;

    const summary2 = computeAsset(def, series, { outDir });

    const after = fs.readFileSync(cacheFile, "utf8");
    assert.equal(summary2.fanRefit, false);
    assert.equal(after, before, "fan-params.json content must be unchanged when reusing the cache");
    assert.equal(fs.statSync(cacheFile).mtimeMs, mtimeBefore, "fan-params.json must not be rewritten");
  });

  test("passing { refit: true } always refits", () => {
    const summary3 = computeAsset(def, series, { outDir, refit: true });
    assert.equal(summary3.fanRefit, true);
  });
});

describe("time origin (B1: ln t must never be 0 on the first row)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "burrito-origin-"));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const series = buildSyntheticSeries(ROW_COUNT);
  const firstDate = series.rows[0].date;
  const outDir = path.join(tmpDir, "metrics");
  const read = (id: string, file: string) =>
    JSON.parse(fs.readFileSync(path.join(outDir, id, file), "utf8"));

  const run = (id: string, origin?: string) => {
    computeAsset({ ...def, id, ...(origin ? { origin } : {}) }, series, { outDir, refit: true });
    return { daily: read(id, "daily.json"), params: read(id, "fan-params.json") };
  };

  const noOrigin = run("origin-absent");
  // The registry sets `origin` to the IPO/inception date, which for most
  // equities is exactly the first data row — the case that used to skip the
  // shift entirely and put the first row at t = 1.
  const atFirstRow = run("origin-at-first-row", firstDate);
  const wellBefore = run("origin-592d-before", "2018-05-19");

  test("an origin equal to the first row is shifted, exactly as an absent origin is", () => {
    assert.equal(atFirstRow.params.originShift, 365);
    assert.equal(noOrigin.params.originShift, 365);
    assert.deepEqual(atFirstRow.daily.rows, noOrigin.daily.rows);
  });

  test("an origin well before the first row keeps its real gap (no shift)", () => {
    assert.equal(wellBefore.params.originShift, 0);
    // A genuine 592-day head start is a different — and different-valued — fit.
    assert.notDeepEqual(wellBefore.daily.rows[0], noOrigin.daily.rows[0]);
  });

  test("an origin closer than a year is shifted only by the shortfall", () => {
    const fiveDaysBefore = new Date(Date.parse(`${firstDate}T00:00:00Z`) - 5 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    assert.equal(run("origin-5d-before", fiveDaysBefore).params.originShift, 360);
  });

  test("fair value on the first row stays the same order of magnitude as the close", () => {
    for (const { daily } of [noOrigin, atFirstRow, wellBefore]) {
      const { close, fair } = daily.rows[0];
      assert.ok(fair !== null && fair > 0, "fair[0] must be a positive number");
      const ratio = fair / close;
      assert.ok(ratio > 0.1 && ratio < 10, `fair[0]/close[0] = ${ratio} is a degenerate left edge`);
    }
  });
});

describe("fan cache fingerprint (B2: a split must force a refit)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "burrito-fancache-"));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  const outDir = path.join(tmpDir, "metrics");
  const series = buildSyntheticSeries(ROW_COUNT);
  const id = "split-test";
  const splitDef = { ...def, id };
  const dir = path.join(outDir, id);
  const fairLast = () =>
    JSON.parse(fs.readFileSync(path.join(dir, "daily.json"), "utf8")).rows.at(-1).fair;

  /** One more bar, so the cache is a day stale rather than fitted through today. */
  const appendOneDay = (s: DailySeries): DailySeries => {
    const last = s.rows[s.rows.length - 1];
    const next = new Date(Date.parse(`${last.date}T00:00:00Z`) + 86_400_000);
    while (next.getUTCDay() === 0 || next.getUTCDay() === 6) next.setUTCDate(next.getUTCDate() + 1);
    const close = last.close * 1.001;
    const row: DailyRow = {
      date: next.toISOString().slice(0, 10),
      open: close,
      high: close,
      low: close,
      close,
      volumeUsd: last.volumeUsd,
    };
    return { ...s, rows: [...s.rows, row] };
  };

  /** A 4:1 split rewrites every close in the file, first row included. */
  const applySplit = (s: DailySeries, factor: number): DailySeries => ({
    ...s,
    rows: s.rows.map((r) => ({
      ...r,
      open: r.open / factor,
      high: r.high / factor,
      low: r.low / factor,
      close: r.close / factor,
    })),
  });

  const baseline = computeAsset(splitDef, series, { outDir, refit: true });
  const baselineFair = fairLast();

  test("a plain append reuses the cached fit", () => {
    const appended = computeAsset(splitDef, appendOneDay(series), { outDir });
    assert.equal(appended.fanRefit, false);
  });

  test("a split rewrite invalidates the cache and refits to the new price scale", () => {
    const split = computeAsset(splitDef, appendOneDay(applySplit(series, 4)), { outDir });
    assert.equal(split.fanRefit, true, "closes[0] changed; the cached fit must not be reused");
    const ratio = baselineFair / fairLast();
    assert.ok(ratio > 3.5 && ratio < 4.5, `fair should fall by ~4x after a 4:1 split, got ${ratio}`);
    assert.equal(baseline.fanRefit, true);
  });

  test("a rewrite of only the recent tail also invalidates the cache", () => {
    computeAsset(splitDef, series, { outDir, refit: true });
    const tailChanged: DailySeries = {
      ...series,
      rows: series.rows.map((r, i) =>
        i === series.rows.length - 1 ? { ...r, close: r.close * 1.5 } : r,
      ),
    };
    // Same firstDate and firstClose, same lastDate — only the fitted-through
    // close moved, which the fittedThroughClose field is there to catch.
    assert.equal(computeAsset(splitDef, appendOneDay(tailChanged), { outDir }).fanRefit, true);
  });

  test("changing the origin shift invalidates the cache", () => {
    computeAsset(splitDef, series, { outDir, refit: true });
    const shifted = computeAsset({ ...splitDef, origin: "2018-05-19" }, appendOneDay(series), {
      outDir,
    });
    assert.equal(shifted.fanRefit, true);
  });
});

describe("fanRefitDue (refit rota)", () => {
  const fitted = "2026-01-01";
  const plus = (days: number) =>
    new Date(Date.parse(`${fitted}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

  test("never refits a fit that already covers the last date", () => {
    assert.equal(fanRefitDue("btc", fitted, fitted), false);
  });

  test("always refits when the cache claims a date past the data", () => {
    assert.equal(fanRefitDue("btc", plus(3), fitted), true);
  });

  test("always refits once the fit is FAN_REFIT_DAYS old", () => {
    assert.equal(fanRefitDue("btc", fitted, plus(FAN_REFIT_DAYS)), true);
    assert.equal(fanRefitDue("btc", fitted, plus(FAN_REFIT_DAYS + 5)), true);
  });

  /** Days (offsets from `fitted`) on which a daily cron would refit this asset. */
  const rota = (id: string, days: number): number[] => {
    let through = fitted;
    const out: number[] = [];
    for (let d = 1; d <= days; d++) {
      if (fanRefitDue(id, through, plus(d))) {
        out.push(d);
        through = plus(d);
      }
    }
    return out;
  };

  test("a daily cron refits each asset exactly once per rota window", () => {
    for (const id of ["btc", "spx", "aapl", "samsung", "pltr"]) {
      const days = rota(id, 3 * FAN_REFIT_DAYS);
      assert.equal(days.length, 3, `${id} refit on days ${days.join(",")} of three windows`);
      assert.equal(days[1] - days[0], FAN_REFIT_DAYS);
      assert.equal(days[2] - days[1], FAN_REFIT_DAYS);
    }
  });

  test("assets are spread across the rota rather than refitting on the same day", () => {
    const ids = ["btc", "eth", "sol", "spx", "ndx", "aapl", "msft", "nvda", "pltr", "cat"];
    const slots = new Set(ids.map((id) => rota(id, FAN_REFIT_DAYS)[0]));
    assert.ok(slots.size >= ids.length - 2, `only ${slots.size} distinct slots for ${ids.length} assets`);
  });

  test("a missed slot day is caught by the age backstop rather than waiting a whole window", () => {
    // The cron was down on the asset's slot day; the next run must still refit.
    const id = "btc";
    const slot = rota(id, FAN_REFIT_DAYS)[0];
    assert.equal(fanRefitDue(id, fitted, plus(slot + 1)), slot + 1 >= FAN_REFIT_DAYS);
    assert.equal(fanRefitDue(id, fitted, plus(FAN_REFIT_DAYS)), true);
  });

  test("the rota slot depends only on the id and the calendar date", () => {
    const day = plus(5);
    assert.equal(fanRefitDue("btc", fitted, day), fanRefitDue("btc", plus(1), day));
  });
});

describe("class-scaled ROI cap (S3) and close-only Supertrend (S4)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "burrito-class-"));
  after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  const outDir = path.join(tmpDir, "metrics");

  /**
   * A single deep cycle over ~6 years of calendar days: up to a peak at day
   * 300, down 75 % by day 500, then a slow recovery. Deep enough that both the
   * crypto (60 %) and equity (35 %) drawdown thresholds call it a cycle.
   */
  function cycleSeries(closeOnly: boolean): DailySeries {
    const rows: DailyRow[] = [];
    for (let i = 0; i < 2200; i++) {
      const date = new Date(Date.parse("2016-01-01T00:00:00Z") + i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      let close: number;
      if (i <= 300) close = 100 * Math.exp((Math.log(10) * i) / 300);
      else if (i <= 500) close = 1000 * Math.exp((Math.log(0.25) * (i - 300)) / 200);
      else close = 250 * Math.exp((Math.log(8) * (i - 500)) / 1700);
      rows.push({
        date,
        open: close,
        high: closeOnly ? close : close * 1.01,
        low: closeOnly ? close : close * 0.99,
        close,
        volumeUsd: 1_000_000,
      });
    }
    return { asset: "CYC", quote: "USD", updatedAt: `${rows.at(-1)!.date}T00:00:00.000Z`, rows };
  }

  const series = cycleSeries(false);
  const lastDay = (id: string, key: "bottoms" | "peaks") => {
    const roi = JSON.parse(fs.readFileSync(path.join(outDir, id, "event-roi.json"), "utf8"));
    return Math.max(...roi[key].flatMap((p: { points: { day: number }[] }) => p.points.map((q) => q.day)));
  };

  test("a crypto asset's ROI paths stop at the four-year cap", () => {
    computeAsset({ ...def, id: "cyc-crypto", class: "crypto", periodsPerYear: 365 }, series, {
      outDir,
      refit: true,
    });
    assert.equal(lastDay("cyc-crypto", "peaks"), 1459);
  });

  test("an equity's ROI paths run past four years instead of freezing", () => {
    computeAsset({ ...def, id: "cyc-equity", class: "equity" }, series, { outDir, refit: true });
    const day = lastDay("cyc-equity", "peaks");
    assert.ok(day > 1460, `equity path still capped at ${day} days`);
    assert.ok(day < 3650, "the ten-year cap should not be reached by a six-year series");
  });

  test("an index gets the same ten-year cap as an equity", () => {
    computeAsset({ ...def, id: "cyc-index", class: "index" }, series, { outDir, refit: true });
    assert.equal(lastDay("cyc-index", "peaks"), lastDay("cyc-equity", "peaks"));
  });

  test("a close-only series leaves Supertrend null on every row and does not throw", () => {
    computeAsset({ ...def, id: "close-only" }, cycleSeries(true), { outDir, refit: true });
    const ta = JSON.parse(fs.readFileSync(path.join(outDir, "close-only", "ta.json"), "utf8"));
    assert.ok(ta.rows.length > 0);
    assert.ok(
      ta.rows.every((r: { stUp: number | null; stDown: number | null }) => r.stUp === null && r.stDown === null),
      "a high == low == close series has no true range; Supertrend must be skipped, not faked",
    );
    // The rest of the TA family is unaffected by the missing range.
    assert.ok(ta.rows.at(-1).sma200d !== null);
  });

  test("a series with real OHLC does produce Supertrend values", () => {
    const ta = JSON.parse(fs.readFileSync(path.join(outDir, "cyc-equity", "ta.json"), "utf8"));
    assert.ok(
      ta.rows.some((r: { stUp: number | null; stDown: number | null }) => r.stUp !== null || r.stDown !== null),
    );
  });
});
