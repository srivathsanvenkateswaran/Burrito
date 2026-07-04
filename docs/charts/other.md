---
title: Other Charts
tags: [burrito, charts, other]
---

# Other Charts

5 charts. Part of the [[charts/index|chart reference]].

## BTC vs. DXY

*Bitcoin against the US Dollar Index — historically strongly negatively correlated.*

The DXY measures the dollar's strength against a basket of major currencies (euro, yen, pound, and others). Bitcoin, priced in dollars and behaving like a liquidity-sensitive risk asset, has historically moved inversely to it: dollar strength coincides with BTC weakness and vice versa.

The big alignments are striking: the 2021 crypto top formed as DXY bottomed, the 2022 bear market tracked DXY's violent rally to 114, and BTC's recoveries have coincided with dollar retreats. The mechanism is macro: a rising dollar usually means tightening global liquidity — the tide that floats or sinks all risk assets.

BTC is on the log scale (right axis), DXY linear (left). The correlation is a regime, not a law — it weakens in quiet macro periods and tightens when the Fed dominates the narrative.

[View live chart →](https://burrito-finance.vercel.app/charts/btc-vs-dxy)

## Benford's Law

*Do Bitcoin's price digits follow the distribution of naturally occurring numbers?*

Benford's Law says that in many naturally occurring datasets, smaller leading digits dominate: numbers starting with 1 appear ~30% of the time, with 9 under 5%. The bars compare Bitcoin's daily closing prices against that theoretical curve.

Data spanning many orders of magnitude (like a price that went from $0.07 to $120k) should follow Benford closely — and Bitcoin does, which is a neat statistical fingerprint of organic, multiplicative growth. Strong deviations in other assets can hint at manipulated or range-pinned prices.

[View live chart →](https://burrito-finance.vercel.app/charts/benfords-law)

## Price Milestone Crossings

*Every crossing of a round-number price level, plotted as events over time.*

Each dot marks a day when price crossed a round-number milestone ($1k, $10k, $20k, …) in either direction. Clusters of dots at one level show price churning around that milestone; a level with a single dot was crossed once and never revisited.

Round numbers act as psychological support and resistance, and this chart makes the battlegrounds visible — the $10k and $20k levels were each crossed dozens of times before finally being left behind, while levels conquered in strong trends barely register a second dot.

[View live chart →](https://burrito-finance.vercel.app/charts/price-milestone-crossings)

## Days Since % Decline

*A running counter of days since the last single-day drop of 5%, 10%, or 20%.*

The counter rises by one each day and resets to zero whenever a daily drop of at least the chosen size (5%, 10%, 20%) occurs, with price shown behind it for context.

Long stretches without a big red day are a feature of maturing bull markets — and the counter's height going into a top measures how complacent the market had become. The declining frequency of 10%+ days across the years is also one of the cleanest views of Bitcoin's falling volatility.

[View live chart →](https://burrito-finance.vercel.app/charts/days-since-percentage-decline)

## Days Since % Gain

*A running counter of days since the last single-day gain of 5%, 10%, or 20%.*

The mirror image of Days Since % Decline: the counter resets whenever a single-day gain of at least the chosen size occurs.

Big green days cluster in two regimes: euphoric bull runs and violent bear-market rallies. A very tall counter means the market has gone a long time without explosive upside — historically common in late bears and early accumulation phases, when volatility is compressed.

[View live chart →](https://burrito-finance.vercel.app/charts/days-since-percentage-gain)
