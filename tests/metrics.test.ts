import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  W,
  dayNumber,
  daysBetween,
  sma,
  ema,
  rsi,
  daysSinceMoveByDate,
  daysToMultipleByDate,
  eventRoiByDate,
  eventLabels,
} from "../scripts/lib/metrics";

describe("W (period-scaled lookback windows)", () => {
  test("ppy=365 (daily crypto): weekly windows scale by 7 rows/week", () => {
    const w = W(365);
    assert.equal(w.w20, 140);
    assert.equal(w.w21ema, 147);
    assert.equal(w.w50, 350);
    assert.equal(w.w200, 1400);
    assert.equal(w.y1, 365);
    assert.equal(w.risk.window, 1460);
    assert.equal(w.risk.warmup, 365);
  });

  test("ppy=252 (trading days): weekly windows scale by 5 rows/week", () => {
    const w = W(252);
    assert.equal(w.w20, 100);
    assert.equal(w.w21ema, 105);
    assert.equal(w.w50, 250);
    assert.equal(w.w200, 1000);
    assert.equal(w.y1, 252);
    assert.equal(w.risk.window, 1008);
    assert.equal(w.risk.warmup, 252);
  });

  test("d50/d200/pi111/pi350/volAnnualize are period-independent except volAnnualize", () => {
    const w365 = W(365);
    const w252 = W(252);
    assert.equal(w365.d50, 50);
    assert.equal(w365.d200, 200);
    assert.equal(w365.pi111, 111);
    assert.equal(w365.pi350, 350);
    assert.equal(w365.volAnnualize, Math.sqrt(365));
    assert.equal(w252.volAnnualize, Math.sqrt(252));
  });
});

describe("dayNumber / daysBetween", () => {
  test("dayNumber counts whole days from the Unix epoch", () => {
    assert.equal(dayNumber("1970-01-01"), 0);
    assert.equal(dayNumber("1970-01-02"), 1);
  });

  test("daysBetween across a leap day (2024) counts 2 calendar days", () => {
    assert.equal(daysBetween("2024-02-28", "2024-03-01"), 2);
  });

  test("daysBetween across the same date range in a non-leap year (2023) counts 1", () => {
    assert.equal(daysBetween("2023-02-28", "2023-03-01"), 1);
  });

  test("daysBetween is negative when `to` precedes `from`", () => {
    assert.equal(daysBetween("2024-03-01", "2024-02-28"), -2);
  });
});

describe("sma / ema / rsi (hand-computed short series)", () => {
  test("sma([1,2,3,4,5], 3)", () => {
    assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
  });

  test("ema([1,2,3,4,5], 3) seeds on the SMA of the first n values", () => {
    assert.deepEqual(ema([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
  });

  test("ema returns all nulls when the series is shorter than n", () => {
    assert.deepEqual(ema([1, 2], 3), [null, null]);
  });

  test("rsi([1,2,1,2,3], n=2) matches a hand-computed Wilder RSI", () => {
    const out = rsi([1, 2, 1, 2, 3], 2);
    assert.equal(out[0], null);
    assert.equal(out[1], null);
    assert.equal(out[2], 50);
    assert.equal(out[3], 75);
    assert.equal(out[4], 87.5);
  });

  test("rsi returns all nulls when the series length is <= n", () => {
    assert.deepEqual(rsi([1, 2, 3], 14).every((v) => v === null), true);
  });
});

describe("calendar-day helpers on a series with a weekend gap", () => {
  // 2020-01-04/05 (Sat/Sun) are missing, so 01-03 -> 01-06 is a 3-day hole.
  const dates = ["2020-01-01", "2020-01-02", "2020-01-03", "2020-01-06", "2020-01-07"];
  const closes = [100, 90, 95, 95.5, 81];

  test("daysSinceMoveByDate counts calendar days, not row counts, since the last event", () => {
    // i=1: -10% decline -> event, resets to 0
    // i=2: +5.56% -> no event; 1 calendar day since 01-02
    // i=3: +0.53% -> no event; 4 calendar days since 01-02 (weekend hole)
    // i=4: -15.18% -> event, resets to 0
    const out = daysSinceMoveByDate(dates, closes, 5, "decline");
    assert.deepEqual(out, [0, 0, 1, 4, 0]);
  });

  test("daysToMultipleByDate reports calendar days to the target, across a gap", () => {
    const out = daysToMultipleByDate(["2020-01-01", "2020-01-10"], [100, 200], 2);
    assert.deepEqual(out, [9, null]);
  });

  test("daysToMultipleByDate is null when the multiple is never reached", () => {
    const out = daysToMultipleByDate(
      ["2020-01-01", "2020-01-02", "2020-01-03", "2020-01-10"],
      [100, 150, 200, 50],
      2,
    );
    assert.deepEqual(out, [2, null, null, null]);
  });
});

describe("eventRoiByDate", () => {
  test("day is calendar days since the event, across a weekend gap", () => {
    const rows = [
      { date: "2020-01-01", close: 100 },
      { date: "2020-01-02", close: 110 },
      { date: "2020-01-06", close: 121 },
      { date: "2020-01-07", close: 99 },
    ];
    const [path] = eventRoiByDate(rows, ["2020-01-02"]);
    assert.equal(path.label, "2020");
    assert.deepEqual(path.points, [
      { day: 0, pct: 0 },
      { day: 4, pct: 10 },
      { day: 5, pct: -10 },
    ]);
  });

  test("a path stops at the next event's start row", () => {
    const rows = [
      { date: "2020-01-01", close: 100 },
      { date: "2020-01-02", close: 110 },
      { date: "2020-01-06", close: 121 },
      { date: "2020-01-07", close: 99 },
    ];
    const [first, second] = eventRoiByDate(rows, ["2020-01-01", "2020-01-06"]);
    assert.deepEqual(first.points, [
      { day: 0, pct: 0 },
      { day: 1, pct: 10 },
    ]);
    assert.deepEqual(second.points, [
      { day: 0, pct: 0 },
      { day: 1, pct: -18.2 },
    ]);
  });

  test("capDays is a calendar-day cap, not a row-count cap", () => {
    const rows = [
      { date: "2020-01-01", close: 100 },
      { date: "2020-01-02", close: 110 },
      { date: "2020-01-03", close: 120 },
      { date: "2020-06-01", close: 500 },
    ];
    const [path] = eventRoiByDate(rows, ["2020-01-01"], 3);
    assert.deepEqual(path.points, [
      { day: 0, pct: 0 },
      { day: 1, pct: 10 },
      { day: 2, pct: 20 },
    ]);
  });
});

describe("eventLabels (S5: no two cycle paths may share a legend label)", () => {
  test("years that are unique stay years", () => {
    assert.deepEqual(eventLabels(["2018-12-15", "2022-11-21", "2025-04-07"]), [
      "2018",
      "2022",
      "2025",
    ]);
  });

  test("two events in one year fall back to YYYY-MM", () => {
    // TSLA's two 2021 peaks, AMD's two 2018 bottoms.
    assert.deepEqual(eventLabels(["2021-01-25", "2021-11-04", "2024-12-17"]), [
      "2021-01",
      "2021-11",
      "2024",
    ]);
  });

  test("only the colliding year is expanded", () => {
    assert.deepEqual(eventLabels(["2024-03-04", "2024-07-10", "2026-01-05"]), [
      "2024-03",
      "2024-07",
      "2026",
    ]);
  });

  test("two events in one month fall back to the full date", () => {
    assert.deepEqual(eventLabels(["2025-05-02", "2025-05-28"]), ["2025-05-02", "2025-05-28"]);
  });

  test("labels are unique for every registry cycle set the reviewer flagged", () => {
    const sets = [
      ["2017-06-01", "2020-02-19", "2021-01-25", "2021-11-04", "2024-12-17", "2025-02-18"],
      ["2018-09-13", "2018-12-24", "2022-10-13", "2025-04-08"],
      ["2024-02-09", "2024-07-08", "2026-01-20"],
      ["2019-12-27", "2024-05-21", "2025-01-23", "2025-09-02"],
      ["2025-01-22", "2025-06-10"],
      ["2021-01-27", "2025-02-19", "2025-08-12"],
    ];
    for (const dates of sets) {
      const labels = eventLabels(dates);
      assert.equal(new Set(labels).size, labels.length, `duplicate label in ${labels.join(",")}`);
    }
  });

  test("eventRoiByDate carries the deduped labels onto its paths", () => {
    const rows = Array.from({ length: 400 }, (_, i) => ({
      date: new Date(Date.parse("2021-01-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10),
      close: 100 + i,
    }));
    const paths = eventRoiByDate(rows, ["2021-01-25", "2021-11-04"]);
    assert.deepEqual(
      paths.map((p) => p.label),
      ["2021-01", "2021-11"],
    );
  });
});

describe("eventRoiByDate capDays", () => {
  const rows = Array.from({ length: 4000 }, (_, i) => ({
    date: new Date(Date.parse("2015-01-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10),
    close: 100 + i,
  }));

  test("the crypto cap stops a path at four years", () => {
    const [path] = eventRoiByDate(rows, ["2015-01-01"], 1460);
    assert.equal(path.points.at(-1)!.day, 1459);
  });

  test("the equity cap lets the same path run ten years", () => {
    const [path] = eventRoiByDate(rows, ["2015-01-01"], 3650);
    assert.equal(path.points.at(-1)!.day, 3649);
  });
});
