/**
 * Auto-generated docs → docs/charts/*.md (reference from the chart registry),
 * docs/snapshot.md (today's readings), and public/burrito-vault.zip (the
 * Obsidian pack). Runs in the daily cron after the computes.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { ChartDef } from "../src/lib/charts";
import { CHARTS, CATEGORIES } from "../src/lib/charts";
import { chartAppliesTo, chartText, type AssetClass } from "../src/lib/chartText";

const docsDir = path.join(process.cwd(), "docs");
const chartsDir = path.join(docsDir, "charts");

const catSlug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Order and prose for the "Available for" line on asset-scoped chart docs. */
const CLASS_ORDER: AssetClass[] = ["crypto", "equity", "index", "stablecoin"];
const CLASS_LABEL: Record<AssetClass, string> = {
  crypto: "crypto",
  equity: "equities",
  index: "indices",
  stablecoin: "stablecoins",
};

function availabilityLine(def: ChartDef): string | null {
  if (def.scope !== "asset") return null;
  const classes = CLASS_ORDER.filter((cls) => chartAppliesTo(def, cls));
  if (!classes.length) return null;
  return `**Available for:** ${classes.map((c) => CLASS_LABEL[c]).join(" · ")}`;
}

function chartReference() {
  fs.mkdirSync(chartsDir, { recursive: true });
  for (const cat of CATEGORIES) {
    const charts = CHARTS.filter((c) => c.category === cat);
    const body = charts
      .map((c) => {
        const text = chartText(c);
        const avail = availabilityLine(c);
        return [
          `## ${text.title}`,
          "",
          `*${text.description}*`,
          "",
          ...text.explanation.map((p) => p + "\n"),
          ...(avail ? [avail, ""] : []),
          `[View live chart →](https://burrito-finance.vercel.app/charts/${c.slug})`,
          "",
        ].join("\n");
      })
      .join("\n");
    fs.writeFileSync(
      path.join(chartsDir, `${catSlug(cat)}.md`),
      `---\ntitle: ${cat} Charts\ntags: [burrito, charts, ${catSlug(cat)}]\n---\n\n# ${cat} Charts\n\n${charts.length} charts. Part of the [[charts/index|chart reference]].\n\n${body}`,
    );
  }
  const moc = CATEGORIES.map(
    (cat) =>
      `- [[charts/${catSlug(cat)}|${cat}]] — ${CHARTS.filter((c) => c.category === cat).length} charts`,
  ).join("\n");
  fs.writeFileSync(
    path.join(chartsDir, "index.md"),
    `---\ntitle: Chart Reference\ntags: [burrito, charts]\n---\n\n# Chart Reference\n\nAll ${CHARTS.length} charts with full explanations, grouped by category. Generated from the site's chart registry — regenerated automatically when charts change.\n\n${moc}\n\nSee also [[risk-metric]] for the methodology behind the risk family.\n`,
  );
  console.log(`chart reference: ${CATEGORIES.length} category docs, ${CHARTS.length} charts`);
}

function snapshot() {
  const read = (p: string) =>
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", p), "utf8"));
  const daily = read("metrics/btc/daily.json");
  const latest = daily.rows.at(-1);
  const summary = read("metrics/assets-summary.json");
  const agg = read("metrics/mcap-aggregates.json").rows.at(-1);
  const oc = read("metrics/onchain-btc.json").rows.at(-1);
  const fng = read("raw/fear-greed.json").rows.at(-1);

  const top = summary.assets
    .slice(0, 10)
    .map(
      (a: any) =>
        `| ${a.symbol} | $${a.close.toLocaleString("en-US", { maximumFractionDigits: a.close > 100 ? 0 : 4 })} | ${a.chg24h >= 0 ? "+" : ""}${a.chg24h}% | ${a.risk.toFixed(2)} |`,
    )
    .join("\n");

  // Equities & indices: only once assets-summary carries class/sector/risk/mayer
  // for them (agent E's cross-asset work) — an empty or partial summary just
  // means no equities section, not a broken snapshot.
  const equities = (summary.assets ?? []).filter(
    (a: any) =>
      (a.class === "equity" || a.class === "index") &&
      typeof a.symbol === "string" &&
      typeof a.name === "string" &&
      typeof a.sector === "string" &&
      typeof a.close === "number" &&
      typeof a.risk === "number" &&
      typeof a.mayer === "number",
  );
  const equitiesSection = equities.length
    ? `\n## Equities & indices\n\n| Symbol | Name | Sector | Close | Risk | Mayer |\n|---|---|---|---|---|---|\n${equities
        .map(
          (a: any) =>
            `| ${a.symbol} | ${a.name} | ${a.sector} | $${a.close.toLocaleString("en-US", { maximumFractionDigits: a.close > 100 ? 0 : 2 })} | ${a.risk.toFixed(2)} | ${a.mayer.toFixed(2)} |`,
        )
        .join("\n")}\n`
    : "";

  fs.writeFileSync(
    path.join(docsDir, "snapshot.md"),
    `---
title: Market Snapshot
tags: [burrito, snapshot]
updated: ${latest.date}
---

# Market Snapshot — ${latest.date}

Auto-generated daily by the burrito pipeline. See [[data-pipeline]] for how.

## Bitcoin

- **Price**: $${latest.close.toLocaleString("en-US")} · **Risk**: ${latest.risk} ([[risk-metric|methodology]])
- **Fair value** (fan median): $${latest.fair.toLocaleString("en-US")}
- **MVRV**: ${oc.mvrv} · **NUPL**: ${oc.nupl} · **Puell**: ${oc.puell}
- **Fear & Greed**: ${fng.value}

## Market

- **Total market cap** (tracked): $${agg.total}B · **BTC dominance**: ${agg.btcDom}% · **SSR**: ${agg.ssr}

## Top assets by market cap

| Asset | Price | 24h | Risk |
|---|---|---|---|
${top}
${equitiesSection}
*Not financial advice. Just a burrito.* 🌯
`,
  );
  console.log(`snapshot: ${latest.date}`);
}

function vaultZip() {
  const pub = path.join(process.cwd(), "public");
  fs.mkdirSync(pub, { recursive: true });
  execSync(`cd ${JSON.stringify(docsDir)} && zip -qr ${JSON.stringify(path.join(pub, "burrito-vault.zip"))} . -x ".*"`, {
    stdio: "inherit",
  });
  const size = fs.statSync(path.join(pub, "burrito-vault.zip")).size;
  console.log(`vault zip: ${(size / 1024).toFixed(0)}KB`);
}

chartReference();
snapshot();
vaultZip();
