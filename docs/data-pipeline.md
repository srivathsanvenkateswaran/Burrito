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
7. `data:equities` — daily bar for each of the 27 equities and 3 indices (Yahoo, Nasdaq.com/Cboe/Naver fallback); non-fatal if it fails
8. `data:stables` — USDT circulating supply (DefiLlama); non-fatal if it fails
9. `data:sec` — SEC shares outstanding for equity market cap; **runs Mondays only** (and on manual dispatch) since filings update quarterly, not daily
10. `data:derivs` — futures/options OI and long/short positioning (upsert; history accumulates)
11. `data:compute` — the full per-asset suite (fans, risk, cycles, TA) for all 33 full-suite assets: BTC, ETH, SOL, 27 equities, 3 indices
12. `data:compute-assets` — cross-asset aggregates: `assets-summary.json`, market-cap aggregates, altseason, breadth
13. `data:compute-stables` — USDT supply-only derived series
14. `data:compute-cross` — cross-asset correlations and normalized comparisons (crypto vs equities, BTC vs SPX/NVDA, …)
15. `data:compute-onchain` — Bitcoin on-chain derived metrics
16. `docs:generate` — chart reference + daily [[snapshot]] regenerated
17. git commit → Vercel auto-deploys

A missed day self-heals: every fetcher requests *everything since its last stored candle*.
A **separate** `backfill-equities.yml` workflow (manual trigger only) re-runs the equity
full-history backfill from a GitHub-hosted (US) runner, where Yahoo answers instead of
429ing — see below.

## Sources and their honesty notes

| Source | Provides | Caveat |
|---|---|---|
| Binance spot | daily OHLCV, 27 assets + SOL | listings start 2017+ (SOL 2020-08-11); pre-2017 BTC from blockchain.info (close-only) |
| Binance futures | OI, long/short | **only 30 days retro** — burrito accumulates history forward from July 2026 |
| Coin Metrics (community) | mcaps, MVRV, addresses, fees, exchange flows | free tier lacks SOPR/CDD/HODL; realized cap derived as mcap ÷ MVRV |
| CoinGecko | supply snapshots | mcaps for SOL/AVAX/TON/etc. are **estimates**: current supply × historical price |
| Yahoo Finance | daily OHLCV + adjusted close for all 27 equities and 3 indices, full listing history | **429s from non-US IPs**, including this repo's local dev; GitHub-hosted runners are US-Azure IPs and work — see [[faq]] |
| Nasdaq.com | equity/index OHLCV fallback when Yahoo 429s | **10-year window only**, split-adjusted but not dividend-adjusted |
| Cboe | S&P 500 close-only fallback (`SPX_History.csv`) | 1975 onward, no key, close only |
| Naver Finance | Samsung Electronics (005930) daily OHLCV in KRW | primary source (Yahoo `005930.KS` as fallback); loose non-strict JSON |
| DefiLlama | USDT circulating supply | daily since 2017-11-29, no key |
| SEC (XBRL frames + companyfacts) | shares outstanding for equity market cap | quarterly cadence; requires a UA with contact info or requests are rejected |
| FRED | US macro | official; monthly/quarterly series lag by design |
| blockchain.com | hash rate, miner revenue | USD series start Aug 2010 |
| Deribit | options OI | snapshot-only; accumulates daily |
| alternative.me | Fear & Greed | begins Feb 2018 |
| Wikimedia | pageviews | begins Jul 2015; 2-day lag |

## Equity fetchers

`scripts/lib/equityData.ts` holds one function per source (`fetchYahooDaily`,
`fetchNasdaqDaily`, `fetchCboeSpx`, `fetchNaverDaily`) plus `fetchAssetDaily(def)`, which
dispatches on the asset's registry `price.kind` and falls through to `price.fallback` on
failure. `scripts/update-equities.ts` runs the daily incremental fetch (last ~10 days,
merged idempotently by date); `scripts/backfill-equities.ts` does the same for full
history and is what `backfill-equities.yml` runs from a US runner. A split is detected by
comparing a freshly fetched close against the stored one for the same date — a >5%
disagreement triggers a full refetch rather than a silently wrong appended bar.

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
Equity history committed to the repo from local development is capped at 10 years
(Nasdaq.com's fallback window) for most names, until `backfill-equities.yml` runs from a
US-based GitHub runner and lands full listing history — see [[assets]] and [[faq]].
