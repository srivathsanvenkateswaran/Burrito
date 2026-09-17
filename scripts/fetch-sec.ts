/**
 * Shares outstanding for every registry equity with a SEC CIK →
 * data/raw/sec/shares.json ({updatedAt, byId: {aapl: {shares, asOf, source}}}).
 * Equity market cap = shares × latest close (computed in compute-assets).
 *
 * Strategy (SEC XBRL APIs, User-Agent with contact required, ≤10 req/s):
 *   1. `frames/dei/EntityCommonStockSharesOutstanding/shares/CY<yyyy>Q<n>I.json`
 *      — every filer's cover-page share count for one calendar quarter in
 *      one call. Start at the current quarter and walk back up to 6 quarters
 *      for filers not yet resolved.
 *   2. `companyfacts/CIK##########.json` for anything still missing: 20-F
 *      filers (annual cover facts) and multi-class filers whose dei fact is
 *      dimensioned by class and therefore absent from frames. Tags tried in
 *      order: dei.EntityCommonStockSharesOutstanding,
 *      us-gaap.CommonStockSharesOutstanding, then
 *      us-gaap.WeightedAverageNumberOfDilutedSharesOutstanding (the only
 *      count SPCX has reported so far, and the total across share classes
 *      for META).
 * ADR listings (TSM: 1 ADR = 5 ordinary shares) are converted to
 * ADR-equivalent counts so shares × ADR price gives the market cap.
 * Run: `npm run data:sec`.
 */
import fs from "node:fs";
import path from "node:path";
import { ASSETS } from "./lib/assets";

/**
 * SEC's fair-access policy requires a User-Agent carrying a working contact,
 * and it blocks obvious placeholders (the previous value was
 * "contact@example.com") with a 403 that fails the whole script. Set
 * SEC_USER_AGENT in the environment to a real contact; the fallback names the
 * project and its repository, which SEC accepts as a contact channel.
 */
const UA =
  process.env.SEC_USER_AGENT?.trim() ||
  "burrito-finance research (https://github.com/srivathsanvenkateswaran/Burrito)";
const OUT = path.join(process.cwd(), "data", "raw", "sec", "shares.json");
const MAX_FRAMES = 6;
const REQUEST_GAP_MS = 150; // stays well under SEC's 10 req/s
/** Ordinary shares per listed ADR/ADS. */
const ADR_RATIO: Record<string, number> = { tsm: 5 };

interface ShareEntry {
  shares: number;
  asOf: string; // YYYY-MM-DD the count is stated for
  source: string; // which endpoint/tag produced it
  adrRatio?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: string): Promise<T | null> {
  await sleep(REQUEST_GAP_MS);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`SEC ${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

/** Instantaneous frame ids from the current calendar quarter backwards. */
function recentFrames(n: number): string[] {
  const now = new Date();
  let y = now.getUTCFullYear();
  let q = Math.floor(now.getUTCMonth() / 3) + 1;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(`CY${y}Q${q}I`);
    q -= 1;
    if (q === 0) {
      q = 4;
      y -= 1;
    }
  }
  return out;
}

interface Fact {
  start?: string;
  end: string;
  val: number;
  form?: string;
  filed?: string;
}
type FactsByTag = Record<string, { units?: { shares?: Fact[] } } | undefined>;
interface CompanyFacts {
  facts?: { dei?: FactsByTag; "us-gaap"?: FactsByTag };
}
interface Frame {
  data?: { cik: number; end: string; val: number }[];
}

/** Latest-dated fact; among ties the shortest period (largest start) then the latest filing. */
function latest(facts: Fact[] | undefined): Fact | null {
  if (!facts?.length) return null;
  return [...facts].sort((a, b) => {
    if (a.end !== b.end) return b.end.localeCompare(a.end);
    const sa = a.start ?? "9999";
    const sb = b.start ?? "9999";
    if (sa !== sb) return sb.localeCompare(sa);
    return (b.filed ?? "").localeCompare(a.filed ?? "");
  })[0];
}

function fromCompanyFacts(json: CompanyFacts): ShareEntry | null {
  const candidates: [string, Fact[] | undefined][] = [
    ["dei.EntityCommonStockSharesOutstanding", json?.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares],
    ["us-gaap.CommonStockSharesOutstanding", json?.facts?.["us-gaap"]?.CommonStockSharesOutstanding?.units?.shares],
    [
      "us-gaap.WeightedAverageNumberOfDilutedSharesOutstanding",
      json?.facts?.["us-gaap"]?.WeightedAverageNumberOfDilutedSharesOutstanding?.units?.shares,
    ],
  ];
  for (const [tag, facts] of candidates) {
    const f = latest(facts?.filter((x) => Number.isFinite(x.val) && x.val > 0));
    if (f) return { shares: f.val, asOf: f.end, source: `companyfacts:${tag}${f.form ? ` (${f.form})` : ""}` };
  }
  return null;
}

async function main() {
  const targets = ASSETS.filter((a) => a.sec);
  const byCik = new Map<number, string>(targets.map((a) => [a.sec!.cik, a.id]));
  const byId: Record<string, ShareEntry> = {};

  for (const frame of recentFrames(MAX_FRAMES)) {
    const unresolved = targets.filter((a) => !byId[a.id]);
    if (unresolved.length === 0) break;
    const url = `https://data.sec.gov/api/xbrl/frames/dei/EntityCommonStockSharesOutstanding/shares/${frame}.json`;
    let json: Frame | null;
    try {
      json = await getJson<Frame>(url);
    } catch (err) {
      console.warn(`${frame}: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    if (!json) {
      console.log(`${frame}: not published yet.`);
      continue;
    }
    let hits = 0;
    for (const d of json.data ?? []) {
      const id = byCik.get(d.cik);
      if (!id || byId[id] || !(d.val > 0)) continue;
      byId[id] = { shares: d.val, asOf: d.end, source: `frames:${frame}` };
      hits++;
    }
    console.log(`${frame}: ${json.data?.length ?? 0} filers, resolved ${hits} (${targets.length - unresolved.length + hits}/${targets.length}).`);
  }

  for (const a of targets.filter((a) => !byId[a.id])) {
    const cik = String(a.sec!.cik).padStart(10, "0");
    try {
      const json = await getJson<CompanyFacts>(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
      const entry = json ? fromCompanyFacts(json) : null;
      if (!entry) {
        console.warn(`${a.id}: no usable share count in companyfacts.`);
        continue;
      }
      byId[a.id] = entry;
      console.log(`${a.id}: ${entry.shares.toLocaleString("en-US")} as of ${entry.asOf} via ${entry.source}`);
    } catch (err) {
      console.warn(`${a.id}: ${err instanceof Error ? err.message : err}`);
    }
  }

  for (const [id, ratio] of Object.entries(ADR_RATIO)) {
    const e = byId[id];
    if (!e) continue;
    byId[id] = { ...e, shares: Math.round(e.shares / ratio), source: `${e.source} ÷ ${ratio} (ADR ratio)`, adrRatio: ratio };
  }

  // Keep previously known entries for anything that failed this run.
  let previous: Record<string, ShareEntry> = {};
  if (fs.existsSync(OUT)) {
    try {
      previous = JSON.parse(fs.readFileSync(OUT, "utf8")).byId ?? {};
    } catch {
      previous = {};
    }
  }
  for (const a of targets) {
    if (!byId[a.id] && previous[a.id]) {
      byId[a.id] = previous[a.id];
      console.warn(`${a.id}: keeping previous value (${previous[a.id].asOf}).`);
    }
  }

  const ordered = Object.fromEntries(targets.filter((a) => byId[a.id]).map((a) => [a.id, byId[a.id]]));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const entries = Object.entries(ordered)
    .map(([id, e]) => `    ${JSON.stringify(id)}: ${JSON.stringify(e)}`)
    .join(",\n");
  fs.writeFileSync(
    OUT,
    `{\n  "updatedAt": ${JSON.stringify(new Date().toISOString())},\n  "byId": {\n${entries}\n  }\n}\n`,
  );
  const missing = targets.filter((a) => !ordered[a.id]).map((a) => a.id);
  console.log(`Wrote ${Object.keys(ordered).length}/${targets.length} entries to ${path.relative(process.cwd(), OUT)}.`);
  if (missing.length) console.warn(`Missing: ${missing.join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
