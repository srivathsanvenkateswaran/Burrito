---
title: Burrito Docs
tags: [burrito, docs]
---

# 🌯 Burrito Documentation

**Burrito** ([burrito-finance.vercel.app](https://burrito-finance.vercel.app)) is a
self-updating quantitative market-analysis site: 98 charts of crypto risk, cycles,
on-chain activity, market breadth, derivatives, and US macro — recomputed daily from
free public data, at $0/month running cost.

## Start here

- [[risk-metric]] — how the 0–1 risk score and the quantile regression fan work
- [[data-pipeline]] — where every number comes from, and how the site updates itself
- [[charts/index|Chart reference]] — all 98 charts, with full explanations
- [[snapshot]] — today's market readings (auto-updated daily)
- [[faq]] — honest answers about accuracy, differences from other sites, and limits

## Using these docs in Obsidian

This documentation is a plain-markdown folder with frontmatter and wikilinks — it **is**
an Obsidian vault. Two ways to use it:

1. **Download**: grab [burrito-vault.zip](https://burrito-finance.vercel.app/burrito-vault.zip)
   and unzip into your vault (or open it as its own vault).
2. **Stay current**: clone the repo and open `docs/` as a vault — `git pull` brings each
   day's fresh [[snapshot]], because the daily data pipeline regenerates it and commits.

## The one-paragraph philosophy

Everything on burrito is **daily-granularity, immutable-once-closed data**. That single
observation drives the whole design: fetch once a day, store as plain JSON in git,
derive every metric with pure functions, serve a fully static site. No API keys in the
browser, no rate limits for visitors, nothing to babysit. Not financial advice — just math
on a warm plate.
