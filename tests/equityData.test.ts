import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  fetchYahooDaily,
  fetchNasdaqDaily,
  fetchCboeSpx,
  fetchNaverDaily,
  fetchAssetDaily,
  detectSplit,
  refetchIsComplete,
  resolveMergeSeam,
  yahooRangeFor,
} from "../scripts/lib/equityData";
import type { DailyRow } from "../scripts/lib/marketData";
import type { AssetDef } from "../scripts/lib/assets";

const FIXTURES = path.join(__dirname, "fixtures");
const readFixture = (name: string) => fs.readFileSync(path.join(FIXTURES, name), "utf8");

type FetchArgs = Parameters<typeof fetch>;
const originalFetch = global.fetch;

/** Install a stub for global.fetch for the duration of one test. */
function stubFetch(handler: (url: string) => { status: number; body: string }) {
  global.fetch = (async (input: FetchArgs[0]) => {
    const url = typeof input === "string" ? input : (input as URL | Request).toString();
    const { status, body } = handler(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: String(status),
      text: async () => body,
    } as Response;
  }) as typeof fetch;
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe("fetchYahooDaily (fixture, no network)", () => {
  const fixture = readFixture("yahoo-aapl.json");

  test("derives the trading date from timestamp + gmtoffset, drops null rows and the live bar", async () => {
    stubFetch(() => ({ status: 200, body: fixture }));
    const rows = await fetchYahooDaily("AAPL");
    // 7 source rows: one null-OHLC (holiday) row and the still-open live-session
    // row are both dropped, leaving 5.
    assert.equal(rows.length, 5);
    assert.deepEqual(
      rows.map((r) => r.date),
      ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-09"],
    );
  });

  test("captures adjClose where the source provides it", async () => {
    stubFetch(() => ({ status: 200, body: fixture }));
    const rows = await fetchYahooDaily("AAPL");
    for (const r of rows) {
      assert.ok(typeof r.adjClose === "number" && r.adjClose! > 0);
    }
    // fixture sets adjClose = close * 0.998
    assert.equal(rows[0].adjClose, Number((rows[0].close * 0.998).toFixed(2)));
  });
});

describe("fetchNasdaqDaily (real captured fixture, trimmed)", () => {
  test("parses MM/DD/YYYY dates and $/comma-formatted numbers, newest-first -> ascending", async () => {
    stubFetch(() => ({ status: 200, body: readFixture("nasdaq-aapl.json") }));
    const rows = await fetchNasdaqDaily("AAPL", "stocks", "2026-01-01", "2026-09-14");
    assert.ok(rows.length > 0);
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i].date > rows[i - 1].date, "rows must be ascending by date");
    }
    const first = rows[0];
    assert.match(first.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(first.close) && first.close > 0);
    assert.ok(Number.isFinite(first.volumeUsd));
  });

  test("$1,234.56 close and 39,269,150 volume parse to plain numbers", async () => {
    const synthetic = {
      data: {
        symbol: "AAPL",
        totalRecords: 1,
        tradesTable: {
          asOf: null,
          headers: {},
          rows: [
            {
              date: "09/14/2026",
              close: "$333.08",
              volume: "39,269,150",
              open: "$334.79",
              high: "$335.50",
              low: "$331.34",
            },
          ],
        },
      },
      status: { rCode: 200 },
    };
    stubFetch(() => ({ status: 200, body: JSON.stringify(synthetic) }));
    const rows = await fetchNasdaqDaily("AAPL", "stocks", "2026-01-01", "2026-09-14");
    assert.deepEqual(rows[0], {
      date: "2026-09-14",
      open: 334.79,
      high: 335.5,
      low: 331.34,
      close: 333.08,
      volumeUsd: 39269150 * 333.08,
      volume: 39269150,
    });
  });

  test('"--" volume/price fields are treated as absent, not NaN/zero', async () => {
    const synthetic = {
      data: {
        symbol: "NDX",
        totalRecords: 1,
        tradesTable: {
          asOf: null,
          headers: {},
          rows: [{ date: "09/14/2026", close: "17500.12", volume: "--", open: "--", high: "--", low: "--" }],
        },
      },
      status: { rCode: 200 },
    };
    stubFetch(() => ({ status: 200, body: JSON.stringify(synthetic) }));
    const rows = await fetchNasdaqDaily("NDX", "index", "2026-01-01", "2026-09-14");
    assert.equal(rows.length, 1);
    // no usable open/high/low -> falls back to close; volume omitted, volumeUsd 0
    assert.equal(rows[0].open, 17500.12);
    assert.equal(rows[0].high, 17500.12);
    assert.equal(rows[0].low, 17500.12);
    assert.equal(rows[0].volumeUsd, 0);
    assert.equal("volume" in rows[0], false);
  });

  test("rCode !== 200 throws", async () => {
    stubFetch(() => ({
      status: 200,
      body: JSON.stringify({ data: null, status: { rCode: 400, bCodeMessage: [{ errorMessage: "Symbol not exists." }] } }),
    }));
    await assert.rejects(() => fetchNasdaqDaily("BOGUS", "stocks", "2026-01-01", "2026-09-14"));
  });
});

describe("fetchCboeSpx (real captured fixture, trimmed)", () => {
  test("parses MM/DD/YYYY,close CSV rows, ascending", async () => {
    stubFetch(() => ({ status: 200, body: readFixture("cboe-spx.csv") }));
    const rows = await fetchCboeSpx();
    assert.equal(rows.length, 30);
    assert.equal(rows[0].date, "1975-01-02");
    assert.equal(rows[0].close, 70.23);
    assert.equal(rows[0].open, 70.23); // Cboe is close-only; OHLC collapses to close
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i].date > rows[i - 1].date);
  });

  test("rejects a CSV with an unexpected header", async () => {
    stubFetch(() => ({ status: 200, body: "NOT,A,HEADER\n1,2,3\n" }));
    await assert.rejects(() => fetchCboeSpx());
  });
});

describe("fetchNaverDaily (real captured fixture, trimmed around a 2018 halt)", () => {
  test("skips open=0 halt rows and parses loose JS-array JSON", async () => {
    stubFetch(() => ({ status: 200, body: readFixture("naver-samsung.json") }));
    const rows = await fetchNaverDaily("005930", "2018-03-01", "2018-06-01");
    const dates = rows.map((r) => r.date);
    // 2018-04-30, 05-02 and 05-03 are halt rows (open=0) in the source fixture.
    assert.ok(!dates.includes("2018-04-30"));
    assert.ok(!dates.includes("2018-05-02"));
    assert.ok(!dates.includes("2018-05-03"));
    assert.ok(dates.includes("2018-04-27"));
    assert.ok(dates.includes("2018-05-04"));
    for (let i = 1; i < rows.length; i++) assert.ok(rows[i].date > rows[i - 1].date);
  });
});

describe("detectSplit", () => {
  const existing = [{ date: "2020-01-01", open: 100, high: 100, low: 100, close: 100, volumeUsd: 0 }];

  test("flags a >5% disagreement on the same date as a split", () => {
    const fetched = [{ date: "2020-01-01", open: 94, high: 94, low: 94, close: 94, volumeUsd: 0 }];
    assert.equal(detectSplit(existing, fetched), "2020-01-01");
  });

  test("does not flag a <=5% disagreement", () => {
    const fetched = [{ date: "2020-01-01", open: 97, high: 97, low: 97, close: 97, volumeUsd: 0 }];
    assert.equal(detectSplit(existing, fetched), null);
  });
});

describe("fetchAssetDaily fallback dispatch", () => {
  test("falls back to the secondary source when the primary keeps 429ing", async () => {
    const def: AssetDef = {
      id: "test-stock",
      symbol: "AAPL",
      name: "Test Stock",
      class: "equity",
      suite: "full",
      sector: "Test",
      about: "test",
      price: { kind: "yahoo", symbol: "AAPL", fallback: { kind: "nasdaq", symbol: "AAPL", assetclass: "stocks" } },
      quote: "USD",
      periodsPerYear: 252,
    };
    let yahooCalls = 0;
    let nasdaqCalls = 0;
    stubFetch((url) => {
      if (url.includes("finance.yahoo.com")) {
        yahooCalls++;
        return { status: 429, body: "rate limited" };
      }
      if (url.includes("api.nasdaq.com")) {
        nasdaqCalls++;
        return { status: 200, body: readFixture("nasdaq-aapl.json") };
      }
      throw new Error(`unexpected url ${url}`);
    });
    const result = await fetchAssetDaily(def, { mode: "backfill" });
    assert.equal(result.source, "nasdaq");
    assert.ok(result.rows.length > 0);
    assert.ok(yahooCalls >= 1, "yahoo must have been attempted");
    assert.equal(nasdaqCalls, 1);
  });
});

/** Minimal bars: only date and close matter to the guards under test. */
const bars = (spec: [string, number][]): DailyRow[] =>
  spec.map(([date, close]) => ({ date, open: close, high: close, low: close, close, volumeUsd: 0 }));

/** `count` consecutive daily bars from `start`, all at `close`. */
const run = (start: string, count: number, close = 100): DailyRow[] =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
    return { date, open: close, high: close, low: close, close, volumeUsd: 0 };
  });

describe("yahooRangeFor (S1: the update range must cover the gap)", () => {
  test("a normal daily gap asks for one month", () => {
    assert.equal(yahooRangeFor("2026-09-04", "2026-09-14"), "1mo");
    assert.equal(yahooRangeFor("2026-08-21", "2026-09-14"), "1mo");
  });

  test("gaps beyond a month widen the range instead of leaving a hole", () => {
    assert.equal(yahooRangeFor("2026-08-01", "2026-09-14"), "3mo"); // 44 days
    assert.equal(yahooRangeFor("2026-06-01", "2026-09-14"), "6mo"); // 105 days
    assert.equal(yahooRangeFor("2026-01-01", "2026-09-14"), "1y"); // 256 days
    assert.equal(yahooRangeFor("2024-01-01", "2026-09-14"), "max");
  });

  test("every range covers at least the gap it was chosen for", () => {
    const nominal: Record<string, number> = { "1mo": 28, "3mo": 89, "6mo": 181, "1y": 364 };
    for (let gap = 0; gap <= 400; gap++) {
      const since = new Date(Date.parse("2026-09-14T00:00:00Z") - gap * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const range = yahooRangeFor(since, "2026-09-14");
      if (range === "max") continue;
      assert.ok(nominal[range] >= gap, `${range} does not cover a ${gap}-day gap`);
    }
  });

  test("a since date in the future degrades to the shortest range, not a throw", () => {
    assert.equal(yahooRangeFor("2026-10-01", "2026-09-14"), "1mo");
  });
});

describe("refetchIsComplete (B3: a split refetch must not truncate history)", () => {
  const existing = run("2016-01-01", 2512);

  test("a full-history refetch replaces the file", () => {
    assert.equal(refetchIsComplete(existing, run("2016-01-01", 2513)), true);
    assert.equal(refetchIsComplete(existing, run("2010-01-01", 4000)), true);
  });

  test("a 10-year Nasdaq window over a longer stored history is rejected", () => {
    // The real failure: Yahoo 429s on a split day, Nasdaq answers with a
    // decade, and the old code wrote it over decades of backfilled bars.
    assert.equal(refetchIsComplete(run("1980-12-12", 11000), run("2016-09-16", 2500)), false);
  });

  test("a refetch that reaches back but comes back sparse is rejected", () => {
    assert.equal(refetchIsComplete(existing, run("2016-01-01", 2000)), false); // 80 % coverage
    assert.equal(refetchIsComplete(existing, run("2016-01-01", 2270)), true); // 90.4 %
  });

  test("an empty refetch is never accepted", () => {
    assert.equal(refetchIsComplete(existing, []), false);
  });

  test("with nothing stored, any non-empty refetch is complete", () => {
    assert.equal(refetchIsComplete([], run("2020-01-01", 5)), true);
    assert.equal(refetchIsComplete([], []), false);
  });
});

describe("resolveMergeSeam (S2: backfill must not merge across a split)", () => {
  test("sources that agree on the overlap are merged", () => {
    const existing = bars([["2026-09-10", 100], ["2026-09-11", 101]]);
    const fetched = bars([["2026-09-11", 101], ["2026-09-12", 102]]);
    assert.deepEqual(resolveMergeSeam(existing, fetched), { seam: null, keep: "merge" });
  });

  test("a >5% disagreement keeps the longer-history source whole", () => {
    // Stored: pre-split Yahoo back to 2010. Fetched: post-split Nasdaq decade.
    const existing = bars([["2010-01-04", 400], ["2026-09-11", 400]]);
    const fetched = bars([["2016-09-16", 100], ["2026-09-11", 100]]);
    assert.deepEqual(resolveMergeSeam(existing, fetched), {
      seam: "2026-09-11",
      keep: "existing",
    });
  });

  test("when the fetched series reaches further back, it wins instead", () => {
    const existing = bars([["2016-09-16", 100], ["2026-09-11", 100]]);
    const fetched = bars([["2010-01-04", 400], ["2026-09-11", 400]]);
    assert.deepEqual(resolveMergeSeam(existing, fetched), { seam: "2026-09-11", keep: "fetched" });
  });

  test("a small cross-source disagreement still merges", () => {
    const existing = bars([["2026-09-11", 100]]);
    const fetched = bars([["2026-09-11", 104], ["2026-09-12", 105]]);
    assert.deepEqual(resolveMergeSeam(existing, fetched), { seam: null, keep: "merge" });
  });

  test("an empty side needs no decision", () => {
    assert.deepEqual(resolveMergeSeam([], bars([["2026-09-11", 100]])), {
      seam: null,
      keep: "fetched",
    });
    assert.deepEqual(resolveMergeSeam(bars([["2026-09-11", 100]]), []), {
      seam: null,
      keep: "existing",
    });
  });
});
