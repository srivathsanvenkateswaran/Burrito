---
title: Risk Charts
tags: [burrito, charts, risk]
---

# Risk Charts

7 charts. Part of the [[charts/index|chart reference]].

## Risk Metric

*0–1 risk score: price's percentile position inside the quantile regression fan. v2.*

The risk metric compresses "how stretched is price right now?" into a single number between 0 and 1. Version 2 reads it directly off the quantile regression fan: if price sits on the fan's median curve, risk is 0.5; on the 95th-percentile curve, 0.95. It is the statistical answer to "how expensive is today relative to Bitcoin's entire trend history?"

How to use it: low readings (green, below 0.2) have historically coincided with bear-market bottoms and accumulation zones; high readings (red, above 0.8) with euphoric tops where risk-reward favors taking profit. Backtested against known reference points, v2 scores the 2013/2017/2021 tops at 0.98–0.99 and the 2022 bottom at 0.01. It is a slow valuation signal, not a trade timer.

Caveats: this is our own model — same family of methods ITC describes (asymmetric quantile regression), but independently fitted. The fan is refit on the full history each day, so all readings shift slightly as new data arrives; extremes are meaningful, mid-range is noise.

[View live chart →](https://burrito-finance.vercel.app/charts/risk)

## Quantile Regression Fan

*Fan chart from asymmetric quadratic quantile regression — the model behind the risk metric.*

Each curve is a separate quadratic quantile regression of log price against log time: the 0.50 curve is the median trend (fair value), while the 0.01 and 0.99 curves bound the historically cheapest and most euphoric extremes. Unlike a least-squares fit, quantile regression is robust to bubbles — the median curve ignores outliers instead of being dragged by them — and fitting each quantile separately lets the fan be asymmetric, wider above than below, like Bitcoin's actual return distribution.

Every band is fit on the full history and rearranged so curves can't cross. Price touching the lower curves has marked every major bottom; riding the upper curves, every mania phase. The risk metric is literally price's interpolated position between these curves.

This mirrors the methodology ITC now uses in place of its retired logarithmic regression (they describe theirs as a "rearranged asymmetric quadratic quantile regression") — ours is an independent implementation of the same idea, so the exact curves will differ.

[View live chart →](https://burrito-finance.vercel.app/charts/asymmetric-quantile-regression-fan)

## Price Color Coded By Risk

*The full price history, colored by the risk metric at each point in time.*

Same data as the Risk Metric chart, painted directly onto price: green stretches are low-risk accumulation zones, red stretches are euphoric extension. The mapping makes the strategy visceral — the green you'd want to have bought is always at the bottom of crashes, which is exactly when buying feels worst.

This is also the fastest way to sanity-check the risk model itself: red lining up with the 2013/2017/2021 tops and green with the 2015/2018/2022 bottoms is exactly the calibration the quantile-fan version of the metric was chosen for.

[View live chart →](https://burrito-finance.vercel.app/charts/risk-colorcoded)

## Time In Risk Bands

*How many of Bitcoin's trading days fall into each 0.1-wide risk bucket.*

Each bar counts the days spent in one 0.1-wide risk band across the full history. The shape tells you what "normal" looks like: most of Bitcoin's life is spent mid-band, and the extreme bands are rare by construction.

Practical use: it calibrates patience. If the sub-0.1 band holds only a small fraction of all days, then deep-value windows are short — when the metric gets there, hesitation has historically been expensive. The same logic applies in reverse for the 0.9+ band.

[View live chart →](https://burrito-finance.vercel.app/charts/risk-time)

## Current Risk Levels

*Today's risk bands projected onto the price scale.*

The horizontal lines answer "what price would move risk to 0.3? To 0.8?" — each line is the price that corresponds to a given risk level under today's model state, drawn over the recent price action.

This turns the risk metric into a planning tool: instead of watching the score, you can set alerts or ladder orders at the prices where your strategy says to act. The levels drift slowly as the regression and the trailing window update, so they're stable enough to plan around week to week.

[View live chart →](https://burrito-finance.vercel.app/charts/risk-levels)

## Short Term Bubble Risk

*How stretched price is above or below its 20-week average, ranked against history.*

Where the main risk metric measures extension from a multi-year fair value, this one measures extension from the 20-week SMA — the same baseline as the Bull Market Support Band — percentile-ranked the same way. It captures short-term froth rather than cycle-scale valuation.

The two risks disagree in useful ways: mid-bull, cycle risk can be moderate while short-term bubble risk pins near 1.0 after a vertical few weeks — historically a local-top warning even when the larger trend had further to run.

[View live chart →](https://burrito-finance.vercel.app/charts/short-term-bubble-risk)

## Risk Dashboard

*Current risk, momentum, and cycle position across all tracked assets.*

Every tracked asset gets the same treatment BTC does: its own quantile-regression fan fitted to its full price history, with risk = the price's current percentile inside that fan. The table sorts by market cap and adds 24h/30d/1y returns, the Mayer Multiple, and whether price sits above its 20-week SMA (the bull-market line).

This is the screen for relative positioning: which majors are stretched, which are washed out, and whether risk is broadly synchronized (macro-driven markets) or dispersed (rotation markets). Assets marked * have under two years of history — their fans are fitted to a single partial cycle, so read those risk values loosely.

[View live chart →](https://burrito-finance.vercel.app/charts/risk-dashboard)
