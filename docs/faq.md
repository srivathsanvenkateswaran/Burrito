---
title: FAQ
tags: [burrito, faq]
---

# FAQ

## Why do your numbers differ from Into The Cryptoverse / Glassnode / CoinMarketCap?

Three honest reasons. (1) **Different models**: the risk metric is burrito's own quantile-fan
implementation — same family of methods ITC describes, independently fitted, so values
differ by construction. (2) **Different universes**: dominance and total-market-cap use
burrito's ~31 tracked assets, not every coin in existence — shapes match, levels sit a few
points apart. (3) **Different sources**: free-tier data (see [[data-pipeline]]) sometimes
means estimates where paid platforms have exact figures (some alt market caps).

## How often does it update?

Once a day, shortly after the UTC daily close (00:30 UTC cron). The footer of every chart
shows the data-through date. Intraday moves won't appear — by design; this is a
daily-granularity site.

## Is the risk metric financial advice?

No. It's a statistical description of where price sits relative to its own history —
see [[risk-metric]] for exactly what it can and cannot say. Nothing here is advice.
Just a burrito.

## Why is [some coin] missing?

The universe is coins with a Binance USDT spot pair plus reliable market-cap data.
Adding one is a single registry line + a backfill run — the pipeline handles the rest.

## Why is AAPL's (and most equities') history only 10 years in this repo?

Two sources feed equity prices: Yahoo Finance, which returns full listing history but
429s requests from non-US IPs, and Nasdaq.com, which answers from any IP but only ever
returns a 10-year window. Local development on this machine hits Yahoo's IP block, so
`npm run data:backfill-equities` here lands whatever Nasdaq.com gives — 10 years for
long-listed names, or the full history for anything that listed more recently than that
(SNDK, ARM, PLTR, CEG, GEV, SPCX). GitHub-hosted Actions runners use US Azure IPs, where
Yahoo answers normally, so the `backfill-equities.yml` workflow (manual trigger, see
[[data-pipeline]]) fetches and commits full history from there. The fetch is idempotent —
running it again only ever fills gaps, never overwrites what's already stored.

## Why is there no chart for SpaceX (SPCX) yet on some pages?

There is a SpaceX asset in the registry and it does have charts — but SPCX only listed on
Nasdaq on 2026-06-12, so as of this writing its price history is 64 trading days long.
Charts that need a meaningful lookback (200-day moving averages, the risk fan, cycle
detection) will look sparse or flat-lined until more history accumulates; nothing is
broken, the company is just three months old on the exchange.

## What benchmark does each asset compare itself against?

Coins compare against Bitcoin (the question being "did this beat just holding BTC");
Bitcoin itself compares against the S&P 500 (the question being "did this beat plain
equity exposure"); every other equity and the Nasdaq indices compare against the S&P 500;
and the S&P 500 compares against the Nasdaq-100. See the `vs-benchmark` chart in
[[charts/index|the chart reference]].

## Why did a chart's history change slightly overnight?

Derived metrics (risk, fans, aggregates) are recomputed from scratch daily, and the fan
refits on all data — so the entire curve shifts microscopically as each day arrives.
Raw price history never changes.

## Can I use the data / fork the site?

Yes — MIT-licensed code, and the JSON data files are in the repo. The underlying data
belongs to its sources (Binance, Coin Metrics, FRED, etc.); check their terms before
commercial use. Attribution appreciated. 🌯
