---
title: Data Sources & Pipeline
tags: [burrito, data, architecture]
---

# Data Sources & the Self-Updating Pipeline

Burrito runs unattended. Every day a GitHub Actions cron fetches new data, recomputes
every metric (including refitting all quantile fans), commits the result to git, and the
site redeploys. This page documents each link in that chain.

## The daily loop

1. `data:update` — append yesterday's closed candle for BTC (Binance, blockchain.info fallback)
2. `data:assets` — same for the other 26 tracked coins
3. `data:external` — Fear & Greed, DXY (Yahoo), Fed balance sheet (FRED)
4. `data:fred` — 24 US macro series
5. `data:mcaps` — market caps (Coin Metrics + CoinGecko supply estimates)
6. `data:onchain` — Coin Metrics on-chain, blockchain.com network stats, Wikipedia views
7. `data:derivs` — futures/options OI and long/short positioning (upsert; history accumulates)
8. `data:compute*` — all derived metrics: fans, risk, aggregates, breadth, comparisons
9. `docs:generate` — chart reference + daily [[snapshot]] regenerated
10. git commit → Vercel auto-deploys

A missed day self-heals: every fetcher requests *everything since its last stored candle*.

## Sources and their honesty notes

| Source | Provides | Caveat |
|---|---|---|
| Binance spot | daily OHLCV, 27 assets | listings start 2017+; pre-2017 BTC from blockchain.info (close-only) |
| Binance futures | OI, long/short | **only 30 days retro** — burrito accumulates history forward from July 2026 |
| Coin Metrics (community) | mcaps, MVRV, addresses, fees, exchange flows | free tier lacks SOPR/CDD/HODL; realized cap derived as mcap ÷ MVRV |
| CoinGecko | supply snapshots | mcaps for SOL/AVAX/TON/etc. are **estimates**: current supply × historical price |
| FRED | US macro | official; monthly/quarterly series lag by design |
| blockchain.com | hash rate, miner revenue | USD series start Aug 2010 |
| Deribit | options OI | snapshot-only; accumulates daily |
| alternative.me | Fear & Greed | begins Feb 2018 |
| Wikimedia | pageviews | begins Jul 2015; 2-day lag |

## Storage philosophy

All data is **flat JSON committed to the repo** (~40MB). Historical daily data is
immutable, so files are append-only; every cron commit is a human-reviewable diff. Raw
data (`data/raw/`) and derived metrics (`data/metrics/`) are separated so formula changes
recompute without refetching. The site is fully static — visitors never hit an API.

## Known gaps

Tracked in the open: TON's Binance feed ended June 2026 (delisting — flagged "stale");
MKR retired after the Sky migration; total market cap is the sum of ~31 tracked assets
(reads a few points different from CoinMarketCap's all-coin total). ~24 ITC-catalog charts
are unbuildable without paid data (Santiment social, X/YouTube history, CDD/SOPR family).
