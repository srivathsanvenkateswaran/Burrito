---
title: Asset Coverage
tags: [burrito, assets, data]
---

# Asset Coverage

Burrito runs the same chart suite — price, risk, cycles, TA, ROI, drawdown, the
quantile-regression fan — over 33 full-suite assets: Bitcoin, Ethereum, Solana, 27
equities, and 3 indices. Everything else in the tracked universe (24 more coins, USDT,
USDC, DAI) gets a lighter treatment; see the notes below the table.

## Full-suite coverage

| Symbol | Name | Class | Sector | Source | History start | About |
|---|---|---|---|---|---|---|
| BTC | Bitcoin | crypto | Layer 1 | Binance | 2009-01-03 (genesis) | The first and largest cryptocurrency, a fixed-supply proof-of-work network launched in 2009. Burrito's reference asset: every cycle, halving and on-chain chart is built around it. |
| ETH | Ethereum | crypto | Layer 1 | Binance | 2017-08-17 | The largest smart-contract platform and the settlement layer for most stablecoins, DeFi and rollups. Second-largest crypto asset by market cap. |
| SOL | Solana | crypto | Layer 1 | Binance | 2020-08-11 | High-throughput single-shard smart-contract chain; the main venue for on-chain trading, memecoins and consumer apps outside Ethereum. |
| AAPL | Apple | equity | Big Tech | Yahoo, fallback Nasdaq.com | 1980-12-12 (IPO) | iPhone, Mac and services company with the largest installed base of consumer devices. Tracked as the on-device AI endpoint and the biggest single weight in the S&P 500. |
| AMZN | Amazon | equity | Big Tech | Yahoo, fallback Nasdaq.com | 1997-05-15 (IPO) | E-commerce and cloud company; AWS is the largest cloud provider and one of the biggest buyers of GPUs and data-centre capacity. |
| META | Meta Platforms | equity | Big Tech | Yahoo, fallback Nasdaq.com | 2012-05-18 (IPO) | Facebook, Instagram and WhatsApp. Trains the open-weight Llama models and is among the largest capex spenders on GPU clusters. |
| NFLX | Netflix | equity | Big Tech | Yahoo, fallback Nasdaq.com | 2002-05-23 (IPO) | Subscription streaming service with more than 300M paid households. |
| GOOGL | Alphabet | equity | Big Tech | Yahoo, fallback Nasdaq.com | 2004-08-19 (IPO) | Search, YouTube, cloud and Gemini; Class A shares. |
| MSFT | Microsoft | equity | Big Tech | Yahoo, fallback Nasdaq.com | 1986-03-13 (IPO) | Azure, Windows, Office and OpenAI's largest backer. |
| ORCL | Oracle | equity | Big Tech | Yahoo, fallback Nasdaq.com | 1986-03-12 (IPO) | Database and enterprise-cloud company, now a major AI-datacentre capacity supplier. |
| TSLA | Tesla | equity | EV & Space | Yahoo, fallback Nasdaq.com | 2010-06-29 (IPO) | Electric vehicles, energy storage and humanoid robotics. |
| SPCX | SpaceX | equity | EV & Space | Yahoo, fallback Nasdaq.com | 2026-06-12 (IPO) | Launch, satellite (Starlink) and spacecraft company; listed on Nasdaq in June 2026. Only 64 trading days of history exist as of this writing — see the FAQ. |
| NVDA | NVIDIA | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 1999-01-22 (IPO) | GPU designer and the dominant supplier of AI-training and inference silicon. |
| AMD | AMD | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 1979-10-15 (NYSE listing) | CPU/GPU designer and NVIDIA's main merchant-silicon competitor. |
| MU | Micron | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 1984-06-01 (IPO) | Memory (DRAM/NAND) manufacturer, a bellwether for AI-server demand. |
| SNDK | Sandisk | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 2025-02-13 (spin-off from WDC) | Flash-storage company spun out of Western Digital. |
| 005930.KS | Samsung Electronics | equity | Semiconductors | Naver, fallback Yahoo | 1990-01-03 | Memory, foundry and consumer-electronics conglomerate; quoted in KRW. |
| AVGO | Broadcom | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 2009-08-06 (IPO) | Networking chips and custom AI accelerators (ASICs) for hyperscalers. |
| TSM | TSMC | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 1997-10-08 (ADR listing) | The world's largest contract chip foundry; fabricates NVIDIA's and Apple's silicon. |
| ASML | ASML | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 1995-03-15 (ADR listing) | Sole supplier of EUV lithography machines; a chokepoint in the chip supply chain. |
| INTC | Intel | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 1971-10-13 (IPO) | Legacy x86 CPU maker rebuilding a foundry business. |
| ARM | Arm Holdings | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 2023-09-14 (IPO) | Licenses the CPU architecture inside nearly every phone and a growing share of servers. |
| SMCI | Super Micro Computer | equity | Semiconductors | Yahoo, fallback Nasdaq.com | 2007-03-29 (IPO) | Builds AI server racks; one of the more volatile hardware plays on the buildout. |
| CAT | Caterpillar | equity | AI infrastructure & power | Yahoo, fallback Nasdaq.com | 1962-01-02 (earliest broadly available) | Heavy machinery; sells the generators used to power data centres ahead of grid capacity. |
| VST | Vistra | equity | AI infrastructure & power | Yahoo, fallback Nasdaq.com | 2016-11-07 (relisting) | Independent power producer with nuclear capacity contracted to data-centre demand. |
| CEG | Constellation Energy | equity | AI infrastructure & power | Yahoo, fallback Nasdaq.com | 2022-01-19 (spin-off from Exelon) | Largest US nuclear-power operator; signed the Three Mile Island restart deal with Microsoft. |
| GEV | GE Vernova | equity | AI infrastructure & power | Yahoo, fallback Nasdaq.com | 2024-03-27 (spin-off from GE) | Power-generation equipment (gas turbines, grid) sized to AI-driven electricity demand. |
| ETN | Eaton | equity | AI infrastructure & power | Yahoo, fallback Nasdaq.com | 1962-01-02 (earliest broadly available) | Electrical equipment maker; data-centre power distribution is a growth segment. |
| VRT | Vertiv | equity | AI infrastructure & power | Yahoo, fallback Nasdaq.com | 2020-02-07 (SPAC merger closed) | Data-centre cooling and power infrastructure. History before the merger is a SPAC shell and is trimmed. |
| PLTR | Palantir | equity | Software & data | Yahoo, fallback Nasdaq.com | 2020-09-30 (direct listing) | Data-analytics platform for government and enterprise; a proxy for AI-software adoption. |
| SPX | S&P 500 | index | Indices | Yahoo, fallback Cboe | 1975-01-02 (Cboe series start) | The benchmark for every other asset in this registry except itself. |
| NDX | Nasdaq-100 | index | Indices | Yahoo, fallback Nasdaq.com | 1985-10-01 | The 100 largest non-financial Nasdaq companies; heavily tech-weighted. |
| IXIC | Nasdaq Composite | index | Indices | Yahoo, fallback Nasdaq.com | 1971-02-05 | All Nasdaq-listed common stock, broader than the Nasdaq-100. |

USDT (stablecoin, `suite: "supply"`) tracks circulating supply only, from DefiLlama, back
to 2017-11-29 — see [[data-pipeline]]. USDC and DAI keep the existing market-cap-only
treatment (`suite: "summary"`), as do the other 24 tradeable coins.

## Two trading calendars: 252 vs 365

Every window in the compute pipeline — the 20-week SMA, the 50W/200W lines, the
risk-fan lookback, volatility annualization — is defined in *trading periods*, not
calendar days, and periods-per-year depends on the asset: crypto trades every day of the
year (`periodsPerYear: 365`), stock and index markets don't (`periodsPerYear: 252`, the
standard US trading-day count). A "20-week SMA" is therefore a 140-day window for BTC and
a 97-day window for AAPL — both cover 20 real-world weeks, expressed in the units each
market actually trades in. Annualized volatility scales by `sqrt(periodsPerYear)` for the
same reason: a daily return's contribution to a year's variance depends on how many days
a year actually prints one.

## Cycle detection

Peaks and bottoms are auto-detected from a drawdown threshold, with `def.cycles` overrides
for BTC's four historical cycles (encoded by hand, not detected). The threshold differs
by class because volatility differs by class:

- **Crypto: 60%** drawdown from an all-time high — anything shallower is routine chop for
  an asset class that has fallen 80%+ multiple times in a decade.
- **Equity: 35%** — a threshold tuned to catch 2000, 2008 and 2022-scale bear markets
  without flagging every double-digit correction.
- **Index: 19%** — just under the conventional 20% bear-market line, so the dot-com,
  financial-crisis and 2022 drawdowns register without a stricter cut hiding them.

A peak is the all-time high before a qualifying drawdown; the bottom is the lowest close
between that peak and the point price recovers to a new all-time high (or the series end).
The most recent ~90 days are never called a confirmed bottom — there's no way to know yet.

## Fan time origin

The quantile-regression fan and the log-regression line are fit in log-time: `ln(days
since origin)`, not `ln(row index)`. `origin` defaults to each asset's first data row, but
for the assets where "the beginning" has independent meaning it's set explicitly —
Bitcoin's genesis block (2009-01-03) and each equity's or index's actual listing/inception
date, even when the stored price history starts later than that. That keeps the fan's time
axis honest about how much of the asset's life the visible history actually covers, rather
than treating "first day the local dataset happens to have" as if it were day one.

## Equity market cap

Equities and indices don't have a circulating-supply concept the way tokens do, so market
cap is computed as **SEC-reported shares outstanding × latest close**, not derived from
any price-history API. Shares come from the SEC's XBRL `frames` endpoint (one call covers
every filer for a quarter) with a `companyfacts` fallback for 20-F filers and anything the
frames call misses; see [[data-pipeline]]. Because SEC filings are quarterly, share counts
lag real time by up to a quarter — market cap moves daily with price but shares update
only a few times a year. Index market cap is not computed at all (`null`): an index isn't
a security with an outstanding-share count, and its "market cap" would just be the sum of
constituents burrito doesn't fully track.

## What equities and indices don't have

The chart suite is shared, but on-chain, mining and derivatives data are Bitcoin-specific
concepts with no equity equivalent, so those categories stay `scope: "btc"` and only ever
render for BTC:

- **On-chain** (MVRV, NUPL, Puell Multiple, exchange flows, addresses) — there is no
  public ledger to read for a stock.
- **Mining** (hash rate, miner revenue, hash ribbons) — no proof-of-work, no miners.
- **Derivatives** (futures open interest, options OI, funding, long/short ratios) — the
  data comes from Binance and Deribit's crypto order books specifically, not from equity
  options exchanges.

Volume charts are offered for crypto and equities but not indices (an index itself has no
traded volume), and a few charts — `roi-after-halving` chief among them — only render when
the asset actually has the underlying event (BTC's four halvings).
