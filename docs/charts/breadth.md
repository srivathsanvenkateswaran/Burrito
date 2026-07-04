---
title: Breadth Charts
tags: [burrito, charts, breadth]
---

# Breadth Charts

7 charts. Part of the [[charts/index|chart reference]].

## Advance Decline Ratios

*The daily share of tracked assets closing up.*

Each day, what fraction of tracked assets closed higher? Smoothed over time this is the market's participation rate — rallies where 80% of assets advance are broad and healthy; rallies where 40% advance are narrow, carried by a few names.

Breadth divergences lead price: market highs made on deteriorating advance ratios (fewer and fewer assets participating) have historically preceded corrections — the crypto version of a classic equity-market signal.

[View live chart →](https://burrito-finance.vercel.app/charts/advance-decline-ratios)

## Advance Decline Index (ADI)

*The running sum of daily advances minus declines.*

ADI accumulates each day's (advances − declines) into a single line — the market's cumulative participation. Rising ADI means most assets are winning most days, regardless of what the total market cap says.

Watch for divergence against price: total market cap making new highs while ADI trends down means the average coin is already in decline — distribution hiding behind a strong index. Convergent new highs in both are the confirmation signal.

[View live chart →](https://burrito-finance.vercel.app/charts/advance-decline-index)

## Absolute Breadth Index (ABI)

*The absolute gap between advances and declines — directionless market intensity.*

ABI is |advances − declines|: how one-sided the day was, ignoring direction. High readings mean the market moved as one block (everything up or everything down); low readings mean an even, mixed tape.

Persistently high ABI marks macro-driven regimes — correlation ≈ 1 days cluster in crashes and manias. Low-ABI stretches are the stock-picker phases where individual assets trade on their own stories.

[View live chart →](https://burrito-finance.vercel.app/charts/absolute-breadth-index)

## Coins Above/Below Moving Average

*The percentage of tracked assets trading above their 20-week SMA.*

The bull-market participation gauge: what share of assets sit above their own 20-week average — the same line the Bull Market Support Band is built on. Above ~80%: broad bull. Below ~20%: broad bear, and historically the washout zone where bottoms form.

This series turns before price at both extremes: bottoms show breadth improving while price still falls (fewer new lows), and tops show breadth decaying while price grinds higher on narrowing leadership.

[View live chart →](https://burrito-finance.vercel.app/charts/above-below-ma)

## Color-Coded MA Strength

*Each asset's moving-average stack: green where the faster average is above the slower.*

Four checks per asset — price above the 20-day, 20 above 50, 50 above 100, 100 above 200 — colored green when true. A full green row is a perfectly bullish MA stack; full red, a perfect downtrend.

The table reads as the market's trend X-ray: transitions matter more than states, and rows flipping from red to mixed to green in sequence trace new uptrends forming asset by asset.

[View live chart →](https://burrito-finance.vercel.app/charts/color-coded-moving-average-strength)

## Alts vs BTC

*Altcoin prices measured in BTC, indexed — which alts actually hold their value against Bitcoin?*

Every line is an alt's BTC-denominated price, indexed to 1.0 two years ago. Below 1.0: you'd hold more value in Bitcoin — the alt "bleeds." The USD chart flatters alts in bull markets; the BTC pair is the honest benchmark.

The sobering base rate: over multi-year windows, most alts bleed most of the time, with brief violent exceptions during alt seasons. This chart is the antidote to survivorship memory — and the toggles let you check any specific coin's verdict.

[View live chart →](https://burrito-finance.vercel.app/charts/alts-vs-btc)

## Correlation Coefficients

*90-day return correlations between the top assets and the dollar index.*

Pearson correlation of daily returns over the trailing 90 days, for the top tracked assets plus DXY. Red cells move together; blue cells move opposite. The BTC row is the one to read: how tightly is everything chained to Bitcoin right now?

Crypto's dirty secret is visible here — intra-crypto correlations usually sit at 0.6–0.9, so diversification across coins diversifies little. The DXY column shows the macro chain: strongly negative in Fed-driven regimes, near zero when crypto trades on its own news.

[View live chart →](https://burrito-finance.vercel.app/charts/correlation-coefficients)
