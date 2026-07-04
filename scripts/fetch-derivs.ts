/**
 * Derivatives data → data/raw/derivs/. Binance futures endpoints only expose
 * ~30 days of history and Deribit only the current options snapshot, so this
 * fetcher UPSERTS by date and history accumulates via the daily cron
 * (collect-forward pattern).
 */
import fs from "node:fs";
import path from "node:path";
import { toUtcDate } from "./lib/marketData";

const dir = path.join(process.cwd(), "data", "raw", "derivs");

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** Merge new rows into an existing file by date (existing history preserved). */
function upsert(file: string, newRows: Record<string, any>[]) {
  const full = path.join(dir, file);
  fs.mkdirSync(dir, { recursive: true });
  let rows: Record<string, any>[] = [];
  if (fs.existsSync(full)) rows = JSON.parse(fs.readFileSync(full, "utf8")).rows;
  const byDate = new Map(rows.map((r) => [r.date, r]));
  for (const r of newRows) byDate.set(r.date, r);
  const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(
    full,
    JSON.stringify({ updatedAt: new Date().toISOString(), rows: merged }),
  );
  return merged.length;
}

async function futuresOi(symbol: string, id: string) {
  const data = (await getJson(
    `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1d&limit=30`,
  )) as any[];
  const rows = data.map((d) => ({
    date: toUtcDate(d.timestamp),
    oiBase: Number(Number(d.sumOpenInterest).toFixed(0)),
    oiUsd: Number(Number(d.sumOpenInterestValue).toFixed(0)),
  }));
  const n = upsert(`futures-oi-${id}.json`, rows);
  console.log(`futures-oi-${id}: +${rows.length} fetched, ${n} total`);
}

async function longShort(symbol: string, id: string) {
  const [topAcct, topPos, global] = await Promise.all([
    getJson(`https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=${symbol}&period=1d&limit=30`),
    getJson(`https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${symbol}&period=1d&limit=30`),
    getJson(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1d&limit=30`),
  ]);
  const byDate = new Map<string, any>();
  const put = (arr: any[], key: string) => {
    for (const d of arr) {
      const date = toUtcDate(d.timestamp);
      const row = byDate.get(date) ?? { date };
      row[key] = Number(Number(d.longShortRatio).toFixed(4));
      if (key === "topAcct") {
        row.longPct = Number((Number(d.longAccount) * 100).toFixed(2));
        row.shortPct = Number((Number(d.shortAccount) * 100).toFixed(2));
      }
      byDate.set(date, row);
    }
  };
  put(topAcct, "topAcct");
  put(topPos, "topPos");
  put(global, "global");
  const n = upsert(`long-short-${id}.json`, [...byDate.values()]);
  console.log(`long-short-${id}: +${byDate.size} fetched, ${n} total`);
}

async function optionsOi(currency: string, id: string) {
  const [book, idx] = await Promise.all([
    getJson(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${currency}&kind=option`),
    getJson(`https://www.deribit.com/api/v2/public/get_index_price?index_name=${currency.toLowerCase()}_usd`),
  ]);
  const oiBase = (book.result as any[]).reduce((s, i) => s + (i.open_interest ?? 0), 0);
  const price = idx.result.index_price as number;
  const row = {
    date: toUtcDate(Date.now()),
    oiBase: Number(oiBase.toFixed(0)),
    oiUsd: Number((oiBase * price).toFixed(0)),
    contracts: (book.result as any[]).length,
  };
  const n = upsert(`options-oi-${id}.json`, [row]);
  console.log(`options-oi-${id}: snapshot ${row.date} ($${(row.oiUsd / 1e9).toFixed(1)}B), ${n} total`);
}

async function main() {
  const jobs = [
    () => futuresOi("BTCUSDT", "btc"),
    () => futuresOi("ETHUSDT", "eth"),
    () => longShort("BTCUSDT", "btc"),
    () => longShort("ETHUSDT", "eth"),
    () => optionsOi("BTC", "btc"),
    () => optionsOi("ETH", "eth"),
  ];
  let failed = 0;
  for (const job of jobs) {
    try {
      await job();
    } catch (err) {
      console.error("deriv fetch failed:", err);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (failed === jobs.length) process.exit(1);
}

main();
