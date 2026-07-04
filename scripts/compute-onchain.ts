/**
 * On-chain derivations → data/metrics/onchain-btc.json (+ eth-lite fields).
 * Sources: data/raw/onchain/{btc,eth}.json (Coin Metrics community) and
 * data/raw/onchain-bc/*.json (blockchain.com). Realized cap is derived as
 * CapMrktCurUSD / CapMVRVCur since CapRealUSD is pro-tier.
 */
import fs from "node:fs";
import path from "node:path";
import { crossDates, sma } from "./lib/metrics";

const rawDir = path.join(process.cwd(), "data", "raw");
const outDir = path.join(process.cwd(), "data", "metrics");

function readJson(p: string): any {
  return JSON.parse(fs.readFileSync(path.join(rawDir, p), "utf8"));
}

function round(v: number | null | undefined, digits = 2): number | null {
  return v === null || v === undefined || !isFinite(v) ? null : Number(v.toFixed(digits));
}

function main() {
  const cm = readJson("onchain/btc.json").rows as any[];
  const bcRev = new Map<string, number>(
    readJson("onchain-bc/miners-revenue.json").rows.map((r: any) => [r.date, r.value]),
  );
  const bcBlockSize = new Map<string, number>(
    readJson("onchain-bc/avg-block-size.json").rows.map((r: any) => [r.date, r.value]),
  );
  const bcUtxo = new Map<string, number>(
    readJson("onchain-bc/utxo-count.json").rows.map((r: any) => [r.date, r.value]),
  );

  // MVRV-Z needs the running std of (mcap − rcap); Puell needs a 365d MA of
  // issuance; thermocap is cumulative miner revenue. One pass in date order.
  const issUsd = cm.map((r) => r.IssTotUSD as number | null);
  const issMa365 = sma(issUsd.map((v) => v ?? 0), 365);
  const hashRates = cm.map((r) => (r.HashRate as number | null) ?? 0);
  const hashSma30 = sma(hashRates, 30);
  const hashSma60 = sma(hashRates, 60);

  let thermo = 0;
  let sumDiff = 0;
  let sumDiffSq = 0;
  let nDiff = 0;
  const rows = cm.map((r, i) => {
    const mcap = r.CapMrktCurUSD as number | null;
    const mvrv = r.CapMVRVCur as number | null;
    const rcap = mcap !== null && mvrv !== null && mvrv > 0 ? mcap / mvrv : null;
    const rev = bcRev.get(r.date) ?? (r.IssTotUSD ?? 0) + (r.FeeTotNtv ?? 0) * (r.PriceUSD ?? 0);
    thermo += rev;
    let mvrvZ: number | null = null;
    if (mcap !== null && rcap !== null) {
      const diff = mcap - rcap;
      sumDiff += diff;
      sumDiffSq += diff * diff;
      nDiff++;
      const mean = sumDiff / nDiff;
      const std = Math.sqrt(Math.max(sumDiffSq / nDiff - mean * mean, 0));
      mvrvZ = std > 0 ? diff / std : null;
    }
    const price = r.PriceUSD as number | null;
    const feesUsd = r.FeeTotNtv !== null && price !== null ? r.FeeTotNtv * price : null;
    const annIss = r.IssTotNtv !== null ? r.IssTotNtv * 365 : null;
    return {
      date: r.date as string,
      mvrv: round(mvrv, 4),
      mvrvZ: round(mvrvZ, 3),
      nupl: mvrv !== null && mvrv > 0 ? round(1 - 1 / mvrv, 4) : null,
      rcap: round(rcap, 0),
      puell:
        issUsd[i] !== null && issMa365[i] !== null && issMa365[i]! > 0
          ? round(issUsd[i]! / issMa365[i]!, 3)
          : null,
      s2f: annIss && r.SplyCur ? round(r.SplyCur / annIss, 2) : null,
      issUsd: round(issUsd[i], 0),
      inflPct: annIss && r.SplyCur ? round((annIss / r.SplyCur) * 100, 3) : null,
      thermo: round(thermo, 0),
      mctc: mcap !== null && thermo > 0 ? round(mcap / thermo, 2) : null,
      rctc: rcap !== null && thermo > 0 ? round(rcap / thermo, 2) : null,
      hashRate: round(r.HashRate, 0),
      hashSma30: round(hashSma30[i], 0),
      hashSma60: round(hashSma60[i], 0),
      hashOverPrice:
        r.HashRate !== null && price !== null && price > 0 ? round(r.HashRate / price, 1) : null,
      minerRev: round(bcRev.get(r.date) ?? null, 0),
      feesUsd: round(feesUsd, 0),
      adrAct: r.AdrActCnt ?? null,
      txCnt: r.TxCnt ?? null,
      txTfrCnt: r.TxTfrCnt ?? null,
      blkCnt: r.BlkCnt ?? null,
      blockSizeMb: round(bcBlockSize.get(r.date) ?? null, 2),
      utxoCount: bcUtxo.get(r.date) ?? null,
      splyExNtv: round(r.SplyExNtv, 0),
      flowInExUsd: round(r.FlowInExUSD, 0),
      flowOutExUsd: round(r.FlowOutExUSD, 0),
      flowNetExUsd:
        r.FlowInExUSD !== null && r.FlowOutExUSD !== null
          ? round(r.FlowInExUSD - r.FlowOutExUSD, 0)
          : null,
      splyCur: round(r.SplyCur, 0),
      price: round(price, 2),
    };
  });

  // hash ribbon events: 30d SMA crossing the 60d (down = capitulation, up = recovery).
  // Difficulty wobble causes rapid flip-flops; keep only regimes that held ≥14 days.
  const rawEvents = crossDates(
    rows.map((r) => r.date),
    hashSma30,
    hashSma60,
  );
  const ribbonEvents: typeof rawEvents = [];
  for (let i = 0; i < rawEvents.length; i++) {
    const next = rawEvents[i + 1];
    const held = next
      ? (Date.parse(next.date) - Date.parse(rawEvents[i].date)) / 86_400_000
      : Infinity;
    if (held >= 14) {
      const prev = ribbonEvents.at(-1);
      if (!prev || prev.type !== rawEvents[i].type) ribbonEvents.push(rawEvents[i]);
    }
  }

  fs.writeFileSync(
    path.join(outDir, "onchain-btc.json"),
    `{\n"updatedAt": ${JSON.stringify(new Date().toISOString())},\n"ribbonEvents": ${JSON.stringify(ribbonEvents)},\n"rows": [\n${rows.map((r) => JSON.stringify(r)).join(",\n")}\n]\n}\n`,
  );

  // eth-lite: the fields the ETH-flavored charts need
  const eth = readJson("onchain/eth.json").rows as any[];
  const ethRows = eth.map((r) => ({
    date: r.date as string,
    adrAct: r.AdrActCnt ?? null,
    feesUsd: r.FeeTotNtv !== null && r.PriceUSD !== null ? round(r.FeeTotNtv * r.PriceUSD, 0) : null,
    splyCur: round(r.SplyCur, 0),
    issNtv: round(r.IssTotNtv, 2),
    mvrv: round(r.CapMVRVCur, 4),
    splyExNtv: round(r.SplyExNtv, 0),
    txCnt: r.TxCnt ?? null,
  }));
  fs.writeFileSync(
    path.join(outDir, "onchain-eth.json"),
    `{\n"updatedAt": ${JSON.stringify(new Date().toISOString())},\n"rows": [\n${ethRows.map((r) => JSON.stringify(r)).join(",\n")}\n]\n}\n`,
  );

  const last = rows.at(-1)!;
  console.log(
    `btc onchain through ${last.date}: mvrv=${last.mvrv} mvrvZ=${last.mvrvZ} nupl=${last.nupl} puell=${last.puell} s2f=${last.s2f} mctc=${last.mctc}`,
  );
  console.log(`ribbon events: ${ribbonEvents.length} | eth rows: ${ethRows.length}`);
}

main();
