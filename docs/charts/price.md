---
title: Price Charts
tags: [burrito, charts, price]
---

# Price Charts

4 charts. Part of the [[charts/index|chart reference]].

## Price + Moving Averages

*BTC with toggleable overlays: log regression bands, Bull Market Support Band (20W SMA / 21W EMA), 50W and 200W SMAs.*

Bitcoin's long-term history only makes sense on a logarithmic scale: each gridline step is a multiplication (10×), not an addition. On a linear scale the early years flatten into a line at zero; on a log scale a move from $1 to $100 is given the same visual weight as $1,000 to $100,000, which is how returns actually compound.

The log regression line is a best-fit curve through the entire price history in log-log space (log of price against log of time since Bitcoin's genesis block, or since a coin's first day of price history). It is a slow-moving estimate of fair value; the shaded band around it is one standard deviation of how far price has historically strayed. Price spends years above and below this line — the point is not that price follows it, but that price has always eventually reverted toward it.

The Bull Market Support Band (20-week SMA and 21-week EMA) is the zone that has repeatedly acted as support during bull markets and resistance during bear markets. Weekly closes above a rising band have historically indicated bull conditions. The 50W and 200W SMAs are the longer-term regime lines: the 200W SMA in particular has marked every major cycle bottom to date.

**Available for:** crypto · equities · indices

[View live chart →](https://burrito-finance.srivathsanvenkateswaran.workers.dev/charts/price)

## Volume

*Daily traded volume of BTC with a 30-period average, under price.*

Each bar is one day's traded volume of BTC — how many units changed hands — with a 30-period simple moving average drawn through it and price above for context. Volume is the one market series not derived from price: it measures how much conviction was behind a move, not just its direction.

The classic reads: rallies on expanding volume are being bought, rallies on shrinking volume are drifting; the largest bars of a decline tend to print at its end, when everyone who was going to sell has sold; and a breakout to new highs on thin volume is the one most likely to fail. Volume also tends to surge on the way down and build more slowly on the way up, which is why capitulation looks like a spike and accumulation looks like a plateau.

Crypto volume here comes from the venue the price series is built on, not from every exchange, and it is quoted in BTC's own units, so a bar's height cannot be compared across assets — read the shape against its own 30-day average. Weekends trade, but thinly, which gives the average a mild weekly ripple.

**Available for:** crypto · equities

[View live chart →](https://burrito-finance.srivathsanvenkateswaran.workers.dev/charts/volume)

## BTC vs Benchmark

*BTC divided by its benchmark — a ratio that rises when BTC outperforms — with a 90-period relative-strength line.*

The ratio line is BTC's price divided by its benchmark's price, rebased so the start of the series reads 1.0. It only moves when the two diverge: a flat ratio through a crash means BTC fell exactly as much as its benchmark; a rising ratio means it is winning, whichever way the market is going. Relative strength is the basis of every rotation strategy because it removes the market's own beta, which nobody controls.

Benchmarks follow the asset's class: coins are measured against Bitcoin, and Bitcoin itself against the S&P 500 — the question for BTC being whether it beats plain equity exposure, the question for every other coin being whether it beats just holding BTC. The 90-period relative-strength line is the ratio's change over the trailing 90 days, in percent: positive means BTC has beaten its benchmark over roughly the last quarter.

Two reads matter more than the rest. A ratio making new highs while the absolute price is still below its own high is early leadership: the asset is being accumulated before the market turns. Price at new highs on a falling ratio is late-cycle beta: the whole market is rising and the asset is along for the ride. For coins, a ratio to Bitcoin that bleeds for years is the base rate, which is why holding above 1.0 here for any length of time is the strongest single filter for next-cycle leadership.

**Available for:** crypto · equities · indices

[View live chart →](https://burrito-finance.srivathsanvenkateswaran.workers.dev/charts/vs-benchmark)

## Crypto vs Equities

*Bitcoin, Ethereum, the S&P 500, the Nasdaq-100 and Nvidia, each rebased to 100 — from January 2020 and from January 2023.*

Every line is a price rebased to 100 on a common start date, so the chart shows relative performance rather than levels: an asset at 300 has tripled since the start. Two rebasings are offered — January 2020, which spans the pandemic crash, the stimulus bull and the 2022 bear; and January 2023, which isolates the current cycle. Log scale, so a doubling takes the same vertical space at any level.

The comparison is the answer to "was the risk worth it?": Bitcoin and Ethereum have outrun the indices over multi-year windows that begin before a crypto bull, and lagged a plain index fund for years over windows that begin near a crypto top. Nvidia is included as the one large equity that has matched crypto's amplitude in this period — roughly a thirtyfold rise from the start of 2020 to its 2025 highs — which is exactly why its correlation with Bitcoin has become a fixture of the cross-asset chart.

Rebased charts are sensitive to the start date by construction — move it a few months and the ranking reshuffles — which is the point of offering two. Read the lines' slopes and drawdowns against each other, not their end values.

[View live chart →](https://burrito-finance.srivathsanvenkateswaran.workers.dev/charts/crypto-vs-equities)
