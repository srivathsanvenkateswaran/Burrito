/**
 * Daily OHLCV fetchers for equities and indices, plus the per-asset
 * dispatcher that tries an asset's primary source and falls back to its
 * secondary one. Sources, URL templates and parsing rules follow the
 * data-source verification report:
 *
 *   Yahoo   v8 chart JSON — full history, adjclose + volume; 429s by IP/region
 *   Nasdaq  api.nasdaq.com historical — 10-year window, split-adjusted, newest first
 *   Cboe    SPX_History.csv — S&P 500 close only since 1975
 *   Naver   siseJson.naver — KRX daily bars in KRW (Samsung), loose JSON
 *
 * Every fetch sends a browser User-Agent, times out after 20 s and retries
 * 429/5xx/network errors twice with backoff. A failure is thrown to the
 * caller, which must treat it per symbol (warn and keep the stale file).
 */
import type { AssetDef, FallbackSource, PriceSource } from "./assets";
import { lastClosedUtcDate, type DailyRow } from "./marketData";

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const TIMEOUT_MS = 20_000;
const RETRIES = 2;
const DAY_MS = 86_400_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class HttpError extends Error {
  constructor(
    public status: number,
    url: string,
    body?: string,
  ) {
    super(`HTTP ${status} for ${url}${body ? `: ${body.trim().slice(0, 120)}` : ""}`);
  }
}

/** ISO date `n` days before now (UTC). */
export function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString().slice(0, 10);
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** GET with browser UA, 20 s timeout and two retries on 429/5xx/network errors. */
export async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(1000 * 3 ** (attempt - 1)); // 1 s, 3 s
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": BROWSER_UA, ...headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await res.text();
      if (res.ok) return text;
      lastErr = new HttpError(res.status, url, text);
      if (res.status !== 429 && res.status < 500) throw lastErr; // 4xx other than 429: don't retry
    } catch (err) {
      if (err instanceof HttpError && err.status !== 429 && err.status < 500) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const text = await fetchText(url, { accept: "application/json", ...headers });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`non-JSON response from ${url}: ${text.slice(0, 120)}`);
  }
}

function num(s: unknown): number {
  if (typeof s === "number") return s;
  if (typeof s !== "string") return NaN;
  const cleaned = s.replace(/[$,\s]/g, "");
  return cleaned === "" || cleaned === "--" ? NaN : Number(cleaned);
}

/** "09/14/2026" → "2026-09-14" */
function fromUsDate(s: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) throw new Error(`unexpected date format: ${s}`);
  return `${m[3]}-${m[1]}-${m[2]}`;
}

function sortDedupe(rows: DailyRow[]): DailyRow[] {
  const byDate = new Map<string, DailyRow>();
  for (const r of rows) byDate.set(r.date, r);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------- Yahoo

interface YahooChart {
  chart?: {
    error?: unknown;
    result?: {
      timestamp?: number[];
      meta?: {
        gmtoffset?: number;
        regularMarketTime?: number;
        currentTradingPeriod?: { regular?: { start: number; end: number } };
      };
      indicators?: {
        quote?: { open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[]; volume?: (number | null)[] }[];
        adjclose?: { adjclose?: (number | null)[] }[];
      };
    }[];
  };
}

export type YahooRange = "max" | "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "10y" | "ytd";

/**
 * Yahoo v8 chart. Timestamps are session-open epochs in exchange time;
 * the trading date is `(timestamp + meta.gmtoffset)` as a UTC date.
 * Holiday/partial rows carry nulls and are dropped. If the regular session
 * is still open (meta.regularMarketTime inside currentTradingPeriod.regular)
 * the bar for that date is intraday and is dropped too.
 */
export async function fetchYahooDaily(symbol: string, range: YahooRange = "max"): Promise<DailyRow[]> {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  const json = await fetchJson<YahooChart>(url);
  const chart = json?.chart;
  if (!chart) throw new Error(`yahoo ${symbol}: unexpected payload`);
  if (chart.error) throw new Error(`yahoo ${symbol}: ${JSON.stringify(chart.error)}`);
  const r = chart.result?.[0];
  if (!r) throw new Error(`yahoo ${symbol}: empty result`);

  const ts: number[] = r.timestamp ?? [];
  const q = r.indicators?.quote?.[0] ?? {};
  const adj: (number | null)[] | undefined = r.indicators?.adjclose?.[0]?.adjclose;
  const gmtoffset: number = r.meta?.gmtoffset ?? 0;
  const toDate = (t: number) => new Date((t + gmtoffset) * 1000).toISOString().slice(0, 10);

  // Drop the live session's bar.
  const rmt: number | undefined = r.meta?.regularMarketTime;
  const reg = r.meta?.currentTradingPeriod?.regular;
  const liveDate =
    rmt != null && reg && rmt >= reg.start && rmt < reg.end ? toDate(rmt) : null;

  const rows: DailyRow[] = [];
  for (let i = 0; i < ts.length; i++) {
    const open = q.open?.[i];
    const high = q.high?.[i];
    const low = q.low?.[i];
    const close = q.close?.[i];
    if (open == null || high == null || low == null || close == null) continue;
    if (![open, high, low, close].every(Number.isFinite) || close <= 0) continue;
    const date = toDate(ts[i]);
    if (date === liveDate) continue;
    const volume = q.volume?.[i];
    const row: DailyRow = {
      date,
      open,
      high,
      low,
      close,
      volumeUsd: volume != null && Number.isFinite(volume) ? volume * close : 0,
    };
    const a = adj?.[i];
    if (a != null && Number.isFinite(a)) row.adjClose = a;
    if (volume != null && Number.isFinite(volume)) row.volume = volume;
    rows.push(row);
  }
  return sortDedupe(rows);
}

// --------------------------------------------------------------- Nasdaq

interface NasdaqRow {
  date: string;
  close: string;
  volume: string;
  open: string;
  high: string;
  low: string;
}
interface NasdaqHistorical {
  data?: { tradesTable?: { rows?: NasdaqRow[] | null } } | null;
  status?: { rCode?: number; bCodeMessage?: { errorMessage?: string }[] | null };
}

/**
 * Nasdaq.com historical table. Only the last 10 years exist; anything older
 * returns rCode 200 with `rows: null`, which is returned here as an empty
 * array — callers must never read empty as "no trading days".
 * Rows arrive newest first with "$1,234.56" strings; index rows have no "$"
 * and `volume: "--"`.
 */
export async function fetchNasdaqDaily(
  symbol: string,
  assetclass: "stocks" | "index",
  from: string,
  to: string,
): Promise<DailyRow[]> {
  const url = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/historical?assetclass=${assetclass}&fromdate=${from}&todate=${to}&limit=20000`;
  const json = await fetchJson<NasdaqHistorical>(url, { accept: "application/json, text/plain, */*" });
  const rCode = json?.status?.rCode;
  if (rCode !== 200) {
    const msg = json?.status?.bCodeMessage?.map((m) => m.errorMessage).join("; ");
    throw new Error(`nasdaq ${symbol}: rCode ${rCode} ${msg ?? ""}`.trim());
  }
  const raw = json?.data?.tradesTable?.rows ?? [];
  const rows: DailyRow[] = [];
  for (const r of raw) {
    const close = num(r.close);
    if (!Number.isFinite(close) || close <= 0) continue;
    const open = num(r.open);
    const high = num(r.high);
    const low = num(r.low);
    const volume = num(r.volume);
    const row: DailyRow = {
      date: fromUsDate(r.date),
      open: Number.isFinite(open) && open > 0 ? open : close,
      high: Number.isFinite(high) && high > 0 ? high : close,
      low: Number.isFinite(low) && low > 0 ? low : close,
      close,
      volumeUsd: Number.isFinite(volume) ? volume * close : 0,
    };
    if (Number.isFinite(volume)) row.volume = volume;
    rows.push(row);
  }
  return sortDedupe(rows);
}

// ----------------------------------------------------------------- Cboe

/** Cboe S&P 500 daily closes since 1975-01-02 (`DATE,SPX`, MM/DD/YYYY). Close only. */
export async function fetchCboeSpx(): Promise<DailyRow[]> {
  const url = "https://cdn.cboe.com/api/global/us_indices/daily_prices/SPX_History.csv";
  const text = await fetchText(url);
  const lines = text.split(/\r?\n/);
  const header = lines[0]?.trim().toUpperCase();
  if (!header?.startsWith("DATE")) throw new Error(`cboe: unexpected header ${lines[0]}`);
  const rows: DailyRow[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [d, v] = line.split(",");
    const close = Number(v);
    if (!Number.isFinite(close) || close <= 0) continue;
    rows.push({ date: fromUsDate(d), open: close, high: close, low: close, close, volumeUsd: 0 });
  }
  if (rows.length === 0) throw new Error("cboe: no rows parsed");
  return sortDedupe(rows);
}

// ---------------------------------------------------------------- Naver

/**
 * Naver Finance daily bars for a KRX symbol ("005930"). The body is a
 * JS-style nested array, not strict JSON: header row then
 * ["YYYYMMDD", open, high, low, close, volume, foreignRatio] with blank
 * lines and a trailing comma when the last column is empty. Halt days
 * appear as open=0 (e.g. the 2018-04-30 .. 05-03 split halt) and are skipped.
 */
export async function fetchNaverDaily(symbol: string, from: string, to: string): Promise<DailyRow[]> {
  const compact = (d: string) => d.replace(/-/g, "");
  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${symbol}&requestType=1&startTime=${compact(from)}&endTime=${compact(to)}&timeframe=day`;
  const text = await fetchText(url);
  const re = /\["(\d{8})",\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*([\d.]*)\s*\]/g;
  const rows: DailyRow[] = [];
  for (const m of text.matchAll(re)) {
    const [, d, o, h, l, c, v] = m;
    const open = Number(o);
    const close = Number(c);
    if (open === 0 || !(close > 0)) continue;
    const volume = Number(v);
    rows.push({
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      open,
      high: Number(h),
      low: Number(l),
      close,
      volumeUsd: volume * close,
      volume,
    });
  }
  if (rows.length === 0) throw new Error(`naver ${symbol}: no rows parsed (format change?)`);
  const sorted = sortDedupe(rows);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].date <= sorted[i - 1].date) throw new Error(`naver ${symbol}: dates not monotonic`);
  }
  return sorted;
}

// ------------------------------------------------------------ dispatcher

/** Assets fed by an exchange-data source (as opposed to Binance or none). */
export function isExchangeAsset(a: AssetDef): boolean {
  return a.price.kind === "yahoo" || a.price.kind === "naver";
}

export type FetchMode = "backfill" | "update";
export interface FetchOptions {
  mode: FetchMode;
  /** update mode: fetch bars from this date (default: 10 days ago) */
  since?: string;
}
export interface FetchResult {
  rows: DailyRow[];
  /** which source actually answered: "yahoo" | "nasdaq" | "cboe" | "naver" */
  source: string;
}

type Source = PriceSource | FallbackSource;

/**
 * Smallest Yahoo range that covers the window back to `since`. Yahoo takes a
 * range, not a from-date, so pinning it at "1mo" meant an update after a
 * longer outage appended only the last month on top of a series that ended
 * weeks earlier and left the middle permanently empty — every other source
 * honours `since` and self-heals. Thresholds sit below each range's nominal
 * length so a partial calendar month still covers the gap.
 */
export function yahooRangeFor(since: string, today = todayUtc()): YahooRange {
  const gap = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${since}T00:00:00Z`)) / DAY_MS);
  if (!Number.isFinite(gap) || gap <= 25) return "1mo";
  if (gap <= 80) return "3mo";
  if (gap <= 170) return "6mo";
  if (gap <= 350) return "1y";
  return "max";
}

async function fetchFromSource(src: Source, def: AssetDef, opts: FetchOptions): Promise<DailyRow[]> {
  const to = todayUtc();
  const since = opts.since ?? daysAgo(10);
  switch (src.kind) {
    case "yahoo":
      return fetchYahooDaily(src.symbol, opts.mode === "backfill" ? "max" : yahooRangeFor(since, to));
    case "nasdaq": {
      if (opts.mode === "update") return fetchNasdaqDaily(src.symbol, src.assetclass, since, to);
      // Backfill: ask from 1970 (the API silently caps at 10 years). If that
      // returns nothing, retry with an explicit window inside the cap.
      const rows = await fetchNasdaqDaily(src.symbol, src.assetclass, def.startDate ?? "1970-01-01", to);
      if (rows.length > 0) return rows;
      return fetchNasdaqDaily(src.symbol, src.assetclass, daysAgo(365 * 10 - 7), to);
    }
    case "cboe": {
      const rows = await fetchCboeSpx();
      return opts.mode === "update" ? rows.filter((r) => r.date >= since) : rows;
    }
    case "naver":
      return fetchNaverDaily(
        src.symbol,
        opts.mode === "update" ? since : (def.startDate ?? "1990-01-01"),
        to,
      );
    case "binance":
      throw new Error(`${def.id}: binance-fed assets are handled by update-assets/backfill-assets`);
    case "none":
      throw new Error(`${def.id}: no price source`);
  }
}

/** Trim to startDate, drop unusable closes and bars after the last closed UTC day. */
export function cleanRows(rows: DailyRow[], def: AssetDef, cutoff = lastClosedUtcDate()): DailyRow[] {
  return sortDedupe(
    rows.filter(
      (r) =>
        Number.isFinite(r.close) &&
        r.close > 0 &&
        (!def.startDate || r.date >= def.startDate) &&
        r.date <= cutoff,
    ),
  );
}

/**
 * Fetch daily bars for one registry asset, trying the primary source and
 * then its fallback. Backfill = full history; update = the window since
 * `opts.since` (default 10 days). Throws only when every source failed.
 */
export async function fetchAssetDaily(def: AssetDef, opts: FetchOptions): Promise<FetchResult> {
  const chain: Source[] = [def.price];
  if ("fallback" in def.price && def.price.fallback) chain.push(def.price.fallback);
  const errors: string[] = [];
  for (const src of chain) {
    try {
      const rows = cleanRows(await fetchFromSource(src, def, opts), def);
      if (rows.length === 0) {
        errors.push(`${src.kind}: 0 rows`);
        continue;
      }
      return { rows, source: src.kind };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${src.kind}: ${msg}`);
      console.warn(`${def.id}: ${src.kind} failed (${msg.slice(0, 160)})`);
    }
  }
  throw new Error(`${def.id}: all sources failed — ${errors.join(" | ")}`);
}

/**
 * True when a freshly fetched bar disagrees with the stored close for the
 * same date by more than `tolerance` — the signature of a split (or a
 * source that adjusts differently). Callers should then refetch full history.
 */
export function detectSplit(existing: DailyRow[], fetched: DailyRow[], tolerance = 0.05): string | null {
  const byDate = new Map(existing.map((r) => [r.date, r.close]));
  for (const r of fetched) {
    const stored = byDate.get(r.date);
    if (stored == null || stored === 0) continue;
    if (Math.abs(r.close / stored - 1) > tolerance) return r.date;
  }
  return null;
}

/**
 * Whether a full-history refetch may replace the stored series outright.
 *
 * A split refetch throws the stored file away, so the replacement has to reach
 * at least as far back and be at least `minCoverage` as dense. Yahoo 429s fall
 * back to Nasdaq, whose stocks endpoint serves only a 10-year window; without
 * this test a split on a day Yahoo rate-limits truncates the file to ten years
 * and the cron commits it.
 */
export function refetchIsComplete(
  existing: DailyRow[],
  refetched: DailyRow[],
  minCoverage = 0.9,
): boolean {
  if (existing.length === 0) return refetched.length > 0;
  if (refetched.length === 0) return false;
  return (
    refetched[0].date <= existing[0].date && refetched.length >= existing.length * minCoverage
  );
}

/** What to do with a fetched series that overlaps a stored one. */
export interface SeamDecision {
  /** First shared date where the two disagree beyond tolerance; null when they agree. */
  seam: string | null;
  /** "merge" when they agree; otherwise the single series to keep whole. */
  keep: "merge" | "fetched" | "existing";
}

/**
 * Decide how to combine a stored series with a freshly fetched one.
 *
 * When they agree on every shared date, merging is safe (fetched wins on the
 * overlap). When they disagree by more than `tolerance`, one of them is on the
 * wrong side of a split — and the split-adjusted scale is a property of the
 * source, not of the date, so merging would paste one scale over the other and
 * leave a step discontinuity at the overlap boundary. In that case neither is
 * patched into the other: the series that reaches further back is kept whole.
 */
export function resolveMergeSeam(
  existing: DailyRow[],
  fetched: DailyRow[],
  tolerance = 0.05,
): SeamDecision {
  if (existing.length === 0) return { seam: null, keep: "fetched" };
  if (fetched.length === 0) return { seam: null, keep: "existing" };
  const seam = detectSplit(existing, fetched, tolerance);
  if (!seam) return { seam: null, keep: "merge" };
  return { seam, keep: fetched[0].date <= existing[0].date ? "fetched" : "existing" };
}
