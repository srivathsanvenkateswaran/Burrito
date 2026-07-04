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

## Why did a chart's history change slightly overnight?

Derived metrics (risk, fans, aggregates) are recomputed from scratch daily, and the fan
refits on all data — so the entire curve shifts microscopically as each day arrives.
Raw price history never changes.

## Can I use the data / fork the site?

Yes — MIT-licensed code, and the JSON data files are in the repo. The underlying data
belongs to its sources (Binance, Coin Metrics, FRED, etc.); check their terms before
commercial use. Attribution appreciated. 🌯
