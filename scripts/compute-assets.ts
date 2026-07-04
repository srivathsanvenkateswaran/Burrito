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
    const sma20d = sma(closes, 20);
    const sma50d = sma(closes, 50);
    const sma100d = sma(closes, 100);
    const maStrength = {
      p20: sma20d[n - 1] !== null && closes[n - 1] > sma20d[n - 1]!,
      s20_50: sma20d[n - 1] !== null && sma50d[n - 1] !== null && sma20d[n - 1]! > sma50d[n - 1]!,
      s50_100: sma50d[n - 1] !== null && sma100d[n - 1] !== null && sma50d[n - 1]! > sma100d[n - 1]!,
      s100_200: sma100d[n - 1] !== null && sma200d[n - 1] !== null && sma100d[n - 1]! > sma200d[n - 1]!,
    };
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
      maStrength,
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

  // ---------- breadth: advances/declines + % above 20W SMA ----------
  const perAsset = new Map<
    string,
    { byDate: Map<string, { close: number; prev: number | null; sma20w: number | null }> }
  >();
  for (const asset of TRADEABLE) {
    const series = readSeries(asset.id);
    if (!series || series.rows.length < 150) continue;
    const closes = series.rows.map((r) => r.close);
    const s20 = sma(closes, 140);
    const byDate = new Map(
      series.rows.map((r, i) => [
        r.date,
        { close: r.close, prev: i > 0 ? closes[i - 1] : null, sma20w: s20[i] },
      ]),
    );
    perAsset.set(asset.id, { byDate });
  }
  let adi = 0;
  const breadth = btcDates
    .filter((d) => d >= "2019-01-01")
    .map((date) => {
      let adv = 0;
      let dec = 0;
      let above = 0;
      let withMa = 0;
      for (const { byDate } of perAsset.values()) {
        const r = byDate.get(date);
        if (!r || r.prev === null) continue;
        if (r.close > r.prev) adv++;
        else if (r.close < r.prev) dec++;
        if (r.sma20w !== null) {
          withMa++;
          if (r.close > r.sma20w) above++;
        }
      }
      adi += adv - dec;
      return {
        date,
        adv,
        dec,
        advPct: adv + dec > 0 ? Number(((adv / (adv + dec)) * 100).toFixed(1)) : null,
        adi,
        abi: Math.abs(adv - dec),
        above20wPct: withMa >= 10 ? Number(((above / withMa) * 100).toFixed(1)) : null,
      };
    });
  fs.writeFileSync(path.join(dir, "breadth.json"), JSON.stringify({ rows: breadth }));

  // ---------- market-cap-weighted portfolios (monthly rebalance, indexed 100) ----------
  const pfDates = btcDates.filter((d) => d >= "2019-01-01");
  const sizes = [5, 10, 20] as const;
  const pfValue: Record<string, number> = { top5: 100, top10: 100, top20: 100, btc: 100 };
  let holdings: Record<string, Map<string, number>> = { top5: new Map(), top10: new Map(), top20: new Map() };
  let curMonth = "";
  const portfolios = pfDates.map((date, di) => {
    const month = date.slice(0, 7);
    if (month !== curMonth) {
      curMonth = month;
      const ranked = TRADEABLE.filter((a) => {
        const m = mcapsById.get(a.id)?.get(date);
        return m !== undefined && perAsset.get(a.id)?.byDate.get(date);
      }).sort(
        (a, b) => (mcapsById.get(b.id)!.get(date) ?? 0) - (mcapsById.get(a.id)!.get(date) ?? 0),
      );
      for (const n of sizes) {
        const top = ranked.slice(0, n);
        const totalM = top.reduce((s, a) => s + mcapsById.get(a.id)!.get(date)!, 0);
        const h = new Map<string, number>();
        for (const a of top) {
          const w = mcapsById.get(a.id)!.get(date)! / totalM;
          const px = perAsset.get(a.id)!.byDate.get(date)!.close;
          h.set(a.id, (pfValue[`top${n}`] * w) / px); // units held
        }
        holdings[`top${n}`] = h;
      }
    }
    if (di > 0) {
      for (const n of sizes) {
        let v = 0;
        for (const [id, units] of holdings[`top${n}`]) {
          const r = perAsset.get(id)!.byDate.get(date);
          if (r) v += units * r.close;
        }
        if (v > 0) pfValue[`top${n}`] = v;
      }
      const b0 = perAsset.get("btc")!.byDate.get(pfDates[0])!.close;
      pfValue.btc = (100 * perAsset.get("btc")!.byDate.get(date)!.close) / b0;
    }
    return {
      date,
      top5: Number(pfValue.top5.toFixed(2)),
      top10: Number(pfValue.top10.toFixed(2)),
      top20: Number(pfValue.top20.toFixed(2)),
      btc: Number(pfValue.btc.toFixed(2)),
    };
  });
  fs.writeFileSync(path.join(dir, "portfolios.json"), JSON.stringify({ rows: portfolios }));

  // ---------- 90d correlation matrix (top assets + DXY) ----------
  const corrIds = summary.slice(0, 12).map((s: any) => s.id);
  const retMap = new Map<string, Map<string, number>>();
  for (const id of corrIds) {
    const series = readSeries(id)!;
    const m = new Map<string, number>();
    for (let i = 1; i < series.rows.length; i++) {
      m.set(series.rows[i].date, Math.log(series.rows[i].close / series.rows[i - 1].close));
    }
    retMap.set(id, m);
  }
  try {
    const dxy = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "raw", "dxy", "daily.json"), "utf8"),
    ).rows as { date: string; close: number }[];
    const m = new Map<string, number>();
    for (let i = 1; i < dxy.length; i++) m.set(dxy[i].date, Math.log(dxy[i].close / dxy[i - 1].close));
    retMap.set("dxy", m);
    corrIds.push("dxy");
  } catch {}
  const last90 = btcDates.slice(-90);
  const corr = corrIds.map((a) =>
    corrIds.map((b) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const d of last90) {
        const x = retMap.get(a)!.get(d);
        const y = retMap.get(b)!.get(d);
        if (x !== undefined && y !== undefined) {
          xs.push(x);
          ys.push(y);
        }
      }
      if (xs.length < 30) return null;
      const mx = xs.reduce((s, v) => s + v, 0) / xs.length;
      const my = ys.reduce((s, v) => s + v, 0) / ys.length;
      let num = 0;
      let dx = 0;
      let dy = 0;
      for (let i = 0; i < xs.length; i++) {
        num += (xs[i] - mx) * (ys[i] - my);
        dx += (xs[i] - mx) ** 2;
        dy += (ys[i] - my) ** 2;
      }
      return dx > 0 && dy > 0 ? Number((num / Math.sqrt(dx * dy)).toFixed(2)) : null;
    }),
  );
  fs.writeFileSync(path.join(dir, "correlations.json"), JSON.stringify({ ids: corrIds, matrix: corr }));

  // ---------- cross-asset ROI comparisons (multiples, days axis) ----------
  const CYCLE_BOTTOM = "2022-11-21";
  const LATEST_PEAK = "2025-10-06";
  const btcByDate = perAsset.get("btc")!.byDate;
  type Line = { id: string; points: { day: number; mult: number }[] };
  const fromAnchor = (anchor: string, pair: boolean): Line[] =>
    TRADEABLE.flatMap((asset) => {
      const byDate = perAsset.get(asset.id)?.byDate;
      if (!byDate) return [];
      if (pair && asset.id === "btc") return [];
      const dates = btcDates.filter((d) => d >= anchor);
      const base = byDate.get(dates[0]);
      const baseBtc = btcByDate.get(dates[0]);
      if (!base || (pair && !baseBtc)) return [];
      const points: { day: number; mult: number }[] = [];
      dates.forEach((d, day) => {
        const r = byDate.get(d);
        const b = btcByDate.get(d);
        if (!r || (pair && !b)) return;
        const mult = pair
          ? r.close / b!.close / (base.close / baseBtc!.close)
          : r.close / base.close;
        points.push({ day, mult: Number(mult.toFixed(4)) });
      });
      return points.length > 30 ? [{ id: asset.id, points }] : [];
    });
  const inception = (pair: boolean): Line[] =>
    TRADEABLE.flatMap((asset) => {
      if (pair && asset.id === "btc") return [];
      const series = readSeries(asset.id)!;
      const base = series.rows[0];
      const baseBtc = btcByDate.get(base.date);
      if (pair && !baseBtc) return [];
      const points: { day: number; mult: number }[] = [];
      series.rows.forEach((r, day) => {
        if (day % 3 !== 0 && day !== series.rows.length - 1) return;
        const b = btcByDate.get(r.date);
        if (pair && !b) return;
        const mult = pair
          ? r.close / b!.close / (base.close / baseBtc!.close)
          : r.close / base.close;
        points.push({ day, mult: Number(mult.toFixed(4)) });
      });
      return [{ id: asset.id, points }];
    });
  // ETH sub-cycle bottoms: fixed knowns + latest 400d low
  const eth = readSeries("eth")!.rows;
  const recent = eth.slice(-400);
  const latestLow = recent.reduce((a, b) => (b.close < a.close ? b : a)).date;
  const ETH_BOTTOMS = ["2018-12-15", "2020-03-13", "2022-06-18", latestLow];
  const ethSub = ETH_BOTTOMS.map((anchor) => {
    const idx = eth.findIndex((r) => r.date >= anchor);
    const next = ETH_BOTTOMS.find((b) => b > anchor);
    const end = next ? eth.findIndex((r) => r.date >= next) : eth.length;
    const base = eth[idx].close;
    return {
      id: anchor.slice(0, 7),
      points: eth.slice(idx, end === -1 ? eth.length : end).map((r, day) => ({
        day,
        mult: Number((r.close / base).toFixed(4)),
      })),
    };
  });
  fs.writeFileSync(
    path.join(dir, "comparisons.json"),
    JSON.stringify({
      anchors: { bottom: CYCLE_BOTTOM, peak: LATEST_PEAK, ethBottoms: ETH_BOTTOMS },
      fromBottom: fromAnchor(CYCLE_BOTTOM, false),
      fromPeak: fromAnchor(LATEST_PEAK, false),
      pairsFromBottom: fromAnchor(CYCLE_BOTTOM, true),
      pairsFromPeak: fromAnchor(LATEST_PEAK, true),
      inception: inception(false),
      pairsInception: inception(true),
      ethSubCycle: ethSub,
    }),
  );

  console.log(
    `summary: ${summary.length} assets | aggregates: ${rows.length} rows | altseason: ${season.length} rows | breadth: ${breadth.length} | portfolios: ${portfolios.length} | corr: ${corrIds.length}x${corrIds.length}`,
  );
  const latest = rows.at(-1)!;
  console.log(
    `today: total=$${latest.total}B btcDom=${latest.btcDom}% ssr=${latest.ssr} altseason=${season.at(-1)?.value}`,
  );
}

main();
