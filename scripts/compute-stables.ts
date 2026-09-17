/**
 * Stablecoin supply metrics: data/raw/stables/<id>.json → data/metrics/<id>/supply.json.
 * Rows carry the circulating supply, its 30- and 90-calendar-day % change and
 * the running all-time-high supply, one row per line.
 */
import fs from "node:fs";
import path from "node:path";
import { ASSETS } from "./lib/assets";
import { jsonLines } from "./lib/computeAsset";
import { dayNumber, roundSig } from "./lib/metrics";

interface RawSupply {
  updatedAt: string;
  rows: { date: string; supply: number }[];
}

export interface SupplyRow {
  date: string;
  supply: number;
  chg30d: number | null;
  chg90d: number | null;
  ath: number;
}

export function supplyMetrics(rows: { date: string; supply: number }[]): SupplyRow[] {
  const sorted = [...rows]
    .filter((r) => Number.isFinite(r.supply) && r.supply > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const dayNums = sorted.map((r) => dayNumber(r.date));
  // supply at the latest row dated at or before `day`, or null before the series starts
  const at = (day: number, hint: number): number | null => {
    let i = Math.min(hint, sorted.length - 1);
    while (i >= 0 && dayNums[i] > day) i--;
    return i < 0 ? null : sorted[i].supply;
  };
  let ath = 0;
  return sorted.map((r, i) => {
    ath = Math.max(ath, r.supply);
    const s30 = at(dayNums[i] - 30, i);
    const s90 = at(dayNums[i] - 90, i);
    return {
      date: r.date,
      supply: roundSig(r.supply)!,
      chg30d: s30 === null ? null : roundSig(Number(((r.supply / s30 - 1) * 100).toFixed(2))),
      chg90d: s90 === null ? null : roundSig(Number(((r.supply / s90 - 1) * 100).toFixed(2))),
      ath: roundSig(ath)!,
    };
  });
}

function main() {
  const root = process.cwd();
  const targets = ASSETS.filter((a) => a.suite === "supply");
  let written = 0;
  for (const def of targets) {
    const file = path.join(root, "data", "raw", "stables", `${def.id}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`[${def.id}] no raw supply at ${path.relative(root, file)}; skipped`);
      continue;
    }
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawSupply;
    const rows = supplyMetrics(raw.rows ?? []);
    if (rows.length === 0) {
      console.warn(`[${def.id}] raw supply has no usable rows; skipped`);
      continue;
    }
    const dir = path.join(root, "data", "metrics", def.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "supply.json"),
      jsonLines({ updatedThrough: rows[rows.length - 1].date, rows }),
    );
    const last = rows[rows.length - 1];
    console.log(
      `[${def.id}] ${rows.length} rows through ${last.date}: supply=${last.supply} chg30d=${last.chg30d}% chg90d=${last.chg90d}% ath=${last.ath}`,
    );
    written++;
  }
  console.log(`${written}/${targets.length} supply series written`);
}

main();
