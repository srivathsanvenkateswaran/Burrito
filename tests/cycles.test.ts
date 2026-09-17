import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { detectCycles, milestoneLevels } from "../scripts/lib/cycles";

describe("detectCycles", () => {
  // Two cycles: peak1 @ 2020-01-03 (200) -> bottom1 @ 2020-01-06 (50, confirmed
  // by the new ATH at 2020-01-08/09); peak2 @ 2020-01-09 (400) -> an
  // in-progress drawdown whose low sits at 2020-01-12 (120), one calendar day
  // before the series ends (so it is still "unconfirmed").
  // Interleaved dips of 10% and 12.5% (below the 50% threshold) must be ignored.
  const rows = [
    { date: "2020-01-01", close: 100 },
    { date: "2020-01-02", close: 150 },
    { date: "2020-01-03", close: 200 }, // peak1
    { date: "2020-01-04", close: 180 }, // -10% dip: below threshold, ignored
    { date: "2020-01-05", close: 90 }, // -55%: enters drawdown
    { date: "2020-01-06", close: 50 }, // cycle-1 low
    { date: "2020-01-07", close: 70 }, // still in drawdown, not a new low
    { date: "2020-01-08", close: 300 }, // new ATH: confirms bottom1 @ 01-06
    { date: "2020-01-09", close: 400 }, // peak2
    { date: "2020-01-10", close: 350 }, // -12.5% dip: below threshold, ignored
    { date: "2020-01-11", close: 150 }, // -62.5%: enters drawdown
    { date: "2020-01-12", close: 120 }, // cycle-2 low (so far)
    { date: "2020-01-13", close: 200 }, // still in drawdown, not a new low
  ];

  test("finds peaks and bottoms of two clear cycles", () => {
    const { peaks, bottoms } = detectCycles(rows, 0.5);
    assert.deepEqual(peaks, ["2020-01-03", "2020-01-09"]);
    // Only cycle 1's bottom is confirmed; cycle 2's low is within the
    // unconfirmed window (1 day since the series only runs one more day).
    assert.deepEqual(bottoms, ["2020-01-06"]);
  });

  test("a drawdown below minDrawdown is never recorded as a peak", () => {
    const { peaks } = detectCycles(rows, 0.5);
    assert.ok(!peaks.includes("2020-01-04")); // -10% dip after 01-03
    assert.ok(!peaks.includes("2020-01-10")); // -12.5% dip after 01-09
  });

  test("a trough within unconfirmedDays of the series end is not a bottom", () => {
    const { bottoms } = detectCycles(rows, 0.5, 90);
    assert.ok(!bottoms.includes("2020-01-12"));
  });

  test("lowering unconfirmedDays confirms a recent trough", () => {
    const { bottoms } = detectCycles(rows, 0.5, 0);
    assert.deepEqual(bottoms, ["2020-01-06", "2020-01-12"]);
  });

  test("empty input returns empty cycles", () => {
    assert.deepEqual(detectCycles([], 0.5), { peaks: [], bottoms: [] });
  });

  test("single-row input returns empty cycles", () => {
    assert.deepEqual(detectCycles([{ date: "2020-01-01", close: 100 }], 0.5), {
      peaks: [],
      bottoms: [],
    });
  });

  test("two-row input with no drawdown returns empty cycles", () => {
    const short = [
      { date: "2020-01-01", close: 100 },
      { date: "2020-01-02", close: 110 },
    ];
    assert.deepEqual(detectCycles(short, 0.5), { peaks: [], bottoms: [] });
  });
});

describe("milestoneLevels", () => {
  test("returns {1,2,5}x10^k levels strictly inside (min, max)", () => {
    const levels = milestoneLevels([1, 100]);
    assert.deepEqual(levels, [2, 5, 10, 20, 50]);
  });

  test("thins to {1,5}x10^k when the full set exceeds cap", () => {
    // Full {1,2,5} set inside (1, 1000) is [2,5,10,20,50,100,200,500] (8 items).
    const levels = milestoneLevels([1, 1000], 5);
    assert.deepEqual(levels, [5, 10, 50, 100, 500]);
  });

  test("cap is honoured (result never exceeds it)", () => {
    const levels = milestoneLevels([0.0001, 100000], 24);
    assert.ok(levels.length <= 24);
  });

  test("handles tiny prices without overflow or NaN", () => {
    const levels = milestoneLevels([0.0001, 0.0005]);
    assert.deepEqual(levels, [0.0002]);
    assert.ok(levels.every(Number.isFinite));
  });

  test("handles large prices", () => {
    const levels = milestoneLevels([50000, 500000]);
    assert.ok(levels.length > 0);
    for (const level of levels) {
      assert.ok(level > 50000 && level < 500000);
      const k = Math.floor(Math.log10(level));
      const mantissa = Number((level / 10 ** k).toPrecision(6));
      assert.ok([1, 2, 5].includes(Math.round(mantissa)));
    }
  });

  test("empty / all-non-positive input returns []", () => {
    assert.deepEqual(milestoneLevels([]), []);
    assert.deepEqual(milestoneLevels([-5, 0, -1]), []);
  });
});
