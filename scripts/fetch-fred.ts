/**
 * FRED macro series → data/raw/fred/<id>.json. Full refetch daily (files are
 * small); skips gracefully without a key, like fetch-external's fed-assets.
 */
import fs from "node:fs";
import path from "node:path";

// registry id → FRED series id
const SERIES: Record<string, string> = {
  cpi: "CPIAUCSL", // CPI, all items (index)
  "core-cpi": "CPILFESL", // CPI ex food & energy
  m1: "M1SL",
  m2: "M2SL",
  "on-rrp": "RRPONTSYD", // overnight reverse repo
  "t10y2y": "T10Y2Y", // 10y–2y spread
  "t10y3m": "T10Y3M",
  ffr: "FEDFUNDS",
  unrate: "UNRATE",
  payems: "PAYEMS", // nonfarm payrolls
  gdp: "GDP",
  "debt-to-gdp": "GFDEGDQ188S",
  "saving-rate": "PSAVERT",
  "real-income": "W875RX1", // real personal income ex transfers
  "disposable-income": "DSPIC96",
  sentiment: "UMCSENT", // U. Michigan consumer sentiment
  "housing-starts": "HOUST",
  "new-home-sales": "HSN1F",
  "mortgage-30y": "MORTGAGE30US",
  "case-shiller": "CSUSHPINSA",
  "consumer-loans": "CCLACBW027SBOG",
  "business-loans": "BUSLOANS",
  "real-estate-loans": "REALLN",
  nfci: "NFCI",
};

function getKey(): string | null {
  if (process.env.FRED_API_KEY) return process.env.FRED_API_KEY;
  try {
    const env = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    return env.match(/^FRED_API_KEY=(.+)$/m)?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const key = getKey();
  if (!key) {
    console.warn("fred: FRED_API_KEY not set — skipping");
    return;
  }
  const dir = path.join(process.cwd(), "data", "raw", "fred");
  fs.mkdirSync(dir, { recursive: true });
  let ok = 0;
  for (const [id, fredId] of Object.entries(SERIES)) {
    try {
      const res = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${key}&file_type=json`,
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const body = (await res.json()) as { observations: { date: string; value: string }[] };
      const rows = body.observations
        .filter((o) => o.value !== ".")
        .map((o) => ({ date: o.date, value: Number(o.value) }));
      fs.writeFileSync(
        path.join(dir, `${id}.json`),
        JSON.stringify({ updatedAt: new Date().toISOString(), fredId, rows }),
      );
      console.log(`${id} (${fredId}): ${rows.length} rows (${rows[0]?.date} → ${rows.at(-1)?.date})`);
      ok++;
    } catch (err) {
      console.error(`${id} (${fredId}) failed:`, err);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (ok === 0) process.exit(1);
}

main();
