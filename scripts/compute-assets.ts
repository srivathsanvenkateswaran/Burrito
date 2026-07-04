/**
 * Multi-asset derivations → data/metrics/:
 *  - assets-summary.json  (current stats per asset, for the risk dashboard)
 *  - mcap-aggregates.json (total/alt mcap, dominance, SSR, total-mcap fair value)
 *  - altseason.json       (% of alts outperforming BTC over trailing 90d)
 * BTC's own deep metrics stay in compute.ts; this file only adds the
 * cross-asset layer.
 */
import fs from "node:fs";
import path from "node:path";
import { ASSETS, STABLES, TRADEABLE } from "./lib/assets";
import { readSeries } from "./lib/marketData";
import { ema, fanPosition, quantileFan, sma } from "./lib/metrics";

const TAUS = [0.01, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 0.99];
const dir = path.join(process.cwd(), "data", "metrics");

function readMcap(id: string): { date: string; mcap: number }[] | null {
  const f = path.join(process.cwd(), "data", "raw", "mcap", `${id}.json`);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf8")).rows;
}

function pctChange(closes: number[], i: number, days: number): number | null {
  return i < days ? null : (closes[i] / closes[i - days] - 1) * 100;
}

function main() {
  // ---------- per-asset summary ----------
  const summary: any[] = [];
  const priceByAsset = new Map<string, Map<string, number>>();
  for (const asset of TRADEABLE) {
    const series = readSeries(asset.id);
    if (!series || series.rows.length < 200) continue;
    const rows = series.rows;
    const closes = rows.map((r) => r.close);
    priceByAsset.set(asset.id, new Map(rows.map((r) => [r.date, r.close])));

    const n = closes.length;
    const days = rows.map((_, i) => i + 30); // days since listing, offset for ln()
    const fan = quantileFan(days, closes, TAUS, 1500);
    const todayLevels = TAUS.map((_, k) => fan.predict(days[n - 1], k));
    const risk = fanPosition(closes[n - 1], todayLevels, TAUS);

    const sma20w = sma(closes, 140);
    const sma200d = sma(closes, 200);
    const mcapRows = readMcap(asset.id);
    const latest = rows[n - 1];
    const staleDays = Math.round(
      (Date.now() - Date.parse(`${latest.date}T00:00:00Z`)) / 86_400_000,
    );
    summary.push({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      close: latest.close,
      chg24h: Number((pctChange(closes, n - 1, 1) ?? 0).toFixed(2)),
      roi30d: pctChange(closes, n - 1, 30) === null ? null : Number(pctChange(closes, n - 1, 30)!.toFixed(1)),
      roi1y: pctChange(closes, n - 1, 365) === null ? null : Number(pctChange(closes, n - 1, 365)!.toFixed(1)),
      mcap: mcapRows?.at(-1)?.mcap ?? null,
      risk: Number(risk.toFixed(3)),
      shortHistory: n < 730,
      mayer: sma200d[n - 1] === null ? null : Number((closes[n - 1] / sma200d[n - 1]!).toFixed(2)),
      above20w: sma20w[n - 1] === null ? null : closes[n - 1] > sma20w[n - 1]!,
      stale: staleDays > 5,
    });
    console.log(`${asset.id}: risk=${risk.toFixed(3)} rows=${n}${n < 730 ? " (short history)" : ""}`);
  }
  summary.sort((a, b) => (b.mcap ?? 0) - (a.mcap ?? 0));
  fs.writeFileSync(
    path.join(dir, "assets-summary.json"),
    JSON.stringify({ updatedAt: new Date().toISOString(), assets: summary }),
  );

  // ---------- market-cap aggregates ----------
  const mcapsById = new Map<string, Map<string, number>>();
  for (const a of ASSETS) {
    const rows = readMcap(a.id);
    if (rows) mcapsById.set(a.id, new Map(rows.map((r) => [r.date, r.mcap])));
  }
  const btcM = mcapsById.get("btc")!;
  const dates = [...btcM.keys()].filter((d) => d >= "2014-01-01").sort();
  const stableIds = new Set(STABLES.map((s) => s.id));
  const agg = dates.map((date) => {
    let total = 0;
    let stables = 0;
    for (const [id, m] of mcapsById) {
      const v = m.get(date);
      if (v === undefined) continue;
      total += v;
      if (stableIds.has(id)) stables += v;
    }
    const btc = btcM.get(date)!;
    const eth = mcapsById.get("eth")?.get(date) ?? 0;
    return {
      date,
      total: Math.round(total / 1e6) / 1e3, // $B
      btcDom: Number(((btc / total) * 100).toFixed(2)),
      ethDom: Number(((eth / total) * 100).toFixed(2)),
      alt: Math.round((total - btc) / 1e6) / 1e3,
      altExEthStables: Math.round((total - btc - eth - stables) / 1e6) / 1e3,
      ssr: stables > 0 ? Number((btc / stables).toFixed(2)) : null,
    };
  });
  // total-mcap fair value via the same quantile fan machinery (median + bands)
  const tDays = agg.map((_, i) => i + 365); // offset: series starts 2014, not genesis
  const totals = agg.map((r) => r.total);
  const fan = quantileFan(tDays, totals, [0.15, 0.5, 0.85], 2000);
  const rows = agg.map((r, i) => ({
    ...r,
    fair: Number(fan.predict(tDays[i], 1).toFixed(1)),
    fairLow: Number(fan.predict(tDays[i], 0).toFixed(1)),
    fairHigh: Number(fan.predict(tDays[i], 2).toFixed(1)),
  }));
  fs.writeFileSync(
    path.join(dir, "mcap-aggregates.json"),
    `{\n"updatedAt": ${JSON.stringify(new Date().toISOString())},\n"rows": [\n${rows.map((r) => JSON.stringify(r)).join(",\n")}\n]\n}\n`,
  );

  // ---------- altcoin season index ----------
  const btcPrices = priceByAsset.get("btc")!;
  const btcDates = [...btcPrices.keys()].sort();
  const altIds = TRADEABLE.filter((a) => a.id !== "btc").map((a) => a.id);
  const season: { date: string; value: number; count: number }[] = [];
  for (const date of btcDates.filter((d) => d >= "2019-01-01")) {
    const past = new Date(Date.parse(`${date}T00:00:00Z`) - 90 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const btcNow = btcPrices.get(date);
    const btcPast = btcPrices.get(past);
    if (!btcNow || !btcPast) continue;
    const btcRet = btcNow / btcPast;
    let beat = 0;
    let count = 0;
    for (const id of altIds) {
      const p = priceByAsset.get(id);
      const now = p?.get(date);
      const then = p?.get(past);
      if (!now || !then) continue;
      count++;
      if (now / then > btcRet) beat++;
    }
    if (count >= 10) {
      season.push({ date, value: Number(((beat / count) * 100).toFixed(1)), count });
    }
  }
  fs.writeFileSync(path.join(dir, "altseason.json"), JSON.stringify({ rows: season }));

  console.log(
    `summary: ${summary.length} assets | aggregates: ${rows.length} rows | altseason: ${season.length} rows`,
  );
  const latest = rows.at(-1)!;
  console.log(
    `today: total=$${latest.total}B btcDom=${latest.btcDom}% ssr=${latest.ssr} altseason=${season.at(-1)?.value}`,
  );
}

main();
