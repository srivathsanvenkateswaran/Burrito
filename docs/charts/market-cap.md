---
title: Market Cap Charts
tags: [burrito, charts, market-cap]
---

# Market Cap Charts

8 charts. Part of the [[charts/index|chart reference]].

## Crypto Heatmap

*Relative market-cap sizes with the day's biggest gainers and losers.*

Each tile's area scales with the square root of the asset's market cap; color shows the 24-hour move. One glance answers two questions: what dominates the market, and what's moving today.

Uniformly red or green boards mean macro is driving everything at once; a mixed board means idiosyncratic, rotational trading — the healthier regime for alt selection.

[View live chart →](https://burrito-finance.vercel.app/charts/heatmap)

## Market Cap Hypotheticals

*What each asset's price would be at another asset's market cap.*

The classic "if X had Y's market cap" table: each cell scales an asset's price by the ratio of the target's market cap to its own. The small multiplier shows how many × away that scenario is.

Its real use is as a plausibility filter: seeing that a favorite small cap needs 100× to reach ETH's cap converts vague dreams into arithmetic. Market cap — not price per coin — is what growth actually has to buy.

[View live chart →](https://burrito-finance.vercel.app/charts/market-capitalization-hypotheticals)

## Portfolios Weighted By Market Cap

*Historical performance of top-5/10/20 market-cap-weighted portfolios vs. holding BTC.*

Three index portfolios — the top 5, 10, and 20 tracked assets, weighted by market cap and rebalanced monthly — against simply holding Bitcoin, all indexed to 100 at the start of 2019.

The uncomfortable finding this chart usually delivers: broad diversification into alts has mostly underperformed just holding BTC across full cycles, because alt drawdowns are deeper than their rallies are higher. Diversification earns its keep only in the alt-season windows — which the gap between the lines makes visible.

[View live chart →](https://burrito-finance.vercel.app/charts/portfolios-weighted-by-market-cap)

## Dominance

*Each asset's market cap as a share of the total tracked crypto market cap.*

Dominance is an asset's market cap divided by the whole market's. BTC dominance is the market's risk dial: money rotates from BTC into alts as cycles heat up (dominance falls) and flees back to BTC — or out entirely — in fear (dominance rises).

Our denominator is the aggregate of the ~30 tracked assets plus major stablecoins rather than every coin in existence, so levels read a few points higher than CoinMarketCap's, but the shape and turning points — which are what dominance is for — match. The classic pattern: dominance peaks near bear-market bottoms and troughs at alt-season manias.

[View live chart →](https://burrito-finance.vercel.app/charts/dominance)

## Total Crypto Market Cap & Trendline

*Aggregate market cap of tracked assets with a fitted trendline and bands.*

The total market cap of all tracked assets (log scale) with a quantile-regression trendline: the middle curve is the median fit, the outer curves the 15th/85th percentile bands. It's the market-wide version of BTC's fair-value model.

Total market cap is arguably a better cycle gauge than BTC's price alone because it absorbs rotation: alt seasons that leave BTC flat still show up here. Note the aggregate is built from our tracked asset set, so early history (pre-2017) undercounts the then-fragmented market.

[View live chart →](https://burrito-finance.vercel.app/charts/market-cap-logarithmic-regression)

## Total Crypto Valuation vs. Trendline

*Extension of the total market cap above or below its fitted trendline.*

This is the trendline chart flattened into a single oscillator: the ratio of total market cap to its median trendline fit. 1.0 means the market sits exactly on trend; 2.0 means double the trend; 0.5 means half.

Cycle tops have historically pushed the ratio far above 1 and bear bottoms well below it, making this the market-wide cousin of the risk metric. Reading today's value against past extremes is the quickest "is crypto as a whole cheap or dear?" check on the site.

[View live chart →](https://burrito-finance.vercel.app/charts/market-cap-vs-fair-value)

## Altcoin Market Capitalizations

*What the market is worth once Bitcoin is removed — and then Ethereum and stablecoins too.*

Two views of the market without its anchor: total minus BTC (everything that isn't Bitcoin), and total minus BTC, ETH, and stablecoins (the speculative long tail). Log scale.

The second line is the purest alt-season gauge: stablecoins don't speculate and ETH half-behaves like a major, so what's left is the risk appetite frontier. Its cycles are more violent than BTC's in both directions — the same chart shape, amplified.

[View live chart →](https://burrito-finance.vercel.app/charts/altcoin-market-capitalizations)

## Stablecoin Supply Ratio (SSR)

*Bitcoin market cap divided by the aggregate stablecoin market cap.*

SSR compares Bitcoin's market cap to the combined market cap of major stablecoins (USDT, USDC, DAI). Stablecoins are the market's dry powder — capital parked on-exchange, one click from buying.

Low SSR means stablecoin buying power is large relative to Bitcoin — historically a supportive setup — while high SSR means little sideline capital remains relative to BTC's size. The metric trends structurally downward as stablecoins grow, so compare against the recent regime rather than 2018 levels.

[View live chart →](https://burrito-finance.vercel.app/charts/ssr)
