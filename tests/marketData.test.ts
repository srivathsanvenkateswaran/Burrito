import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { mergeRows, writeSeries, readSeries, seriesPath, type DailyRow, type DailySeries } from "../scripts/lib/marketData";

describe("mergeRows", () => {
  const a: DailyRow[] = [
    { date: "2020-01-01", open: 1, high: 1, low: 1, close: 1, volumeUsd: 0 },
    { date: "2020-01-02", open: 2, high: 2, low: 2, close: 2, volumeUsd: 0 },
  ];

  test("merging a series with itself is idempotent", () => {
    const merged = mergeRows(a, a);
    assert.deepEqual(merged, a);
    assert.deepEqual(mergeRows(merged, merged), merged);
  });

  test("rows from `preferred` win on date conflicts", () => {
    const base: DailyRow[] = [{ date: "2020-01-01", open: 1, high: 1, low: 1, close: 1, volumeUsd: 0 }];
    const preferred: DailyRow[] = [{ date: "2020-01-01", open: 9, high: 9, low: 9, close: 9, volumeUsd: 0 }];
    const merged = mergeRows(base, preferred);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].close, 9);
  });

  test("merges and sorts rows from disjoint dates", () => {
    const base: DailyRow[] = [{ date: "2020-01-03", open: 3, high: 3, low: 3, close: 3, volumeUsd: 0 }];
    const preferred: DailyRow[] = [{ date: "2020-01-01", open: 1, high: 1, low: 1, close: 1, volumeUsd: 0 }];
    const merged = mergeRows(base, preferred);
    assert.deepEqual(
      merged.map((r) => r.date),
      ["2020-01-01", "2020-01-03"],
    );
  });
});

describe("writeSeries / readSeries round-trip", () => {
  // seriesPath() resolves under process.cwd(), so point cwd at a scratch dir
  // for the duration of this suite and restore it afterward.
  const originalCwd = process.cwd();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "burrito-marketdata-"));
  process.chdir(tmpDir);

  after(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("round-trips asset/quote/updatedAt/rows", () => {
    const series: DailySeries = {
      asset: "TEST",
      quote: "USD",
      updatedAt: "2024-01-01T00:00:00.000Z",
      rows: [
        { date: "2020-01-01", open: 1, high: 1.5, low: 0.5, close: 1.2, volumeUsd: 100 },
        { date: "2020-01-02", open: 1.2, high: 1.3, low: 1.1, close: 1.25, volumeUsd: 200, adjClose: 1.24, volume: 50 },
      ],
    };
    writeSeries(series);
    assert.ok(fs.existsSync(seriesPath("TEST")));
    const read = readSeries("TEST");
    assert.deepEqual(read, series);
  });

  test("writeSeries with an explicit id writes under that directory", () => {
    const series: DailySeries = {
      asset: "005930.KS",
      quote: "KRW",
      updatedAt: "2024-01-01T00:00:00.000Z",
      rows: [{ date: "2020-01-01", open: 100, high: 100, low: 100, close: 100, volumeUsd: 0 }],
    };
    writeSeries(series, "samsung");
    assert.equal(readSeries("005930.KS"), null);
    assert.deepEqual(readSeries("samsung"), series);
  });

  test("readSeries returns null for a missing asset", () => {
    assert.equal(readSeries("does-not-exist"), null);
  });
});
