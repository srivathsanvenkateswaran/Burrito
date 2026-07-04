/**
 * Wikipedia daily pageviews per article via the Wikimedia REST API — refetched
 * in full since one call covers the whole range. Attention proxy for crypto.
 */
import fs from "node:fs";
import path from "node:path";
import { toUtcDate } from "./lib/marketData";

const ARTICLES = ["Bitcoin", "Ethereum", "Cryptocurrency", "Blockchain"];

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      // Wikimedia requires a descriptive User-Agent
      "user-agent": "burrito-charts/1.0 (personal project)",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function write(rel: string, data: unknown) {
  const file = path.join(process.cwd(), "data", "raw", rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchArticle(article: string) {
  const today = toUtcDate(Date.now()).replaceAll("-", "");
  const body = await getJson(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(article)}/daily/20150701/${today}`,
  );
  // timestamps are "YYYYMMDD00"; last ~2 days lag, so drop them
  const cutoff = toUtcDate(Date.now() - 2 * 86_400_000);
  const rows = (body.items as any[])
    .map((it) => {
      const t = it.timestamp as string;
      return {
        date: `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`,
        views: Number(it.views),
      };
    })
    .filter((r) => r.date <= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
  write(path.join("wiki", `${article.toLowerCase()}.json`), {
    updatedAt: new Date().toISOString(),
    rows,
  });
  console.log(`wiki/${article.toLowerCase()}: ${rows.length} rows (${rows[0].date} → ${rows.at(-1)!.date})`);
}

async function main() {
  // sequential with a small gap — be polite to the Wikimedia API
  const results: PromiseSettledResult<void>[] = [];
  for (const article of ARTICLES) {
    results.push(...(await Promise.allSettled([fetchArticle(article)])));
    if (article !== ARTICLES.at(-1)) await sleep(300);
  }
  const failed = results.filter((r) => r.status === "rejected");
  for (const f of failed) console.error("fetch failed:", (f as PromiseRejectedResult).reason);
  // partial failure is fine (stale file stays); total failure should fail the job
  if (failed.length === results.length) process.exit(1);
}

main();
