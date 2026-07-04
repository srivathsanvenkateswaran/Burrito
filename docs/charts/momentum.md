---
title: Momentum Charts
tags: [burrito, charts, momentum]
---

# Momentum Charts

7 charts. Part of the [[charts/index|chart reference]].

## Supertrend

*An ATR-based trailing stop that flips between support and resistance with the trend.*

Supertrend places a trailing stop line a multiple of Average True Range (here 3× the 10-day ATR) below price in uptrends and above it in downtrends, flipping sides when price crosses it. Green segments mark uptrend support; red segments mark downtrend resistance.

Because ATR widens with volatility, the stop gives more room in wild markets and tightens in calm ones. It shines as a trend-following exit discipline; it chops badly in sideways markets, like every trend indicator. Series starts in 2017, when true daily high/low data begins.

[View live chart →](https://burrito-finance.vercel.app/charts/supertrend)

## RSI (14d)

*Wilder's Relative Strength Index on daily closes. Overbought above 70, oversold below 30.*

The Relative Strength Index (J. Welles Wilder, 1978) measures the speed of recent price changes: it compares the average size of up-days against down-days over the last 14 days and maps the result to a 0–100 scale. Persistent buying pushes it toward 100, persistent selling toward 0.

The standard reading: above 70 is "overbought" (the rally is stretched and prone to a pause), below 30 is "oversold" (selling is exhausted). In strong crypto bull markets the daily RSI can pin above 70 for weeks, so overbought is not an automatic sell — the more reliable signals are oversold readings during established uptrends, and divergences, where price makes a new high but RSI makes a lower high, hinting momentum is fading.

RSI is a fast momentum gauge, best for timing within a trend. It says nothing about valuation — pair it with the slower metrics (risk, Mayer) for the bigger picture.

[View live chart →](https://burrito-finance.vercel.app/charts/rsi)

## Volatility

*Rolling standard deviation of daily log returns, over 30, 60, and 180-day windows.*

Each line is the standard deviation of daily log returns over a rolling window, in percent per day. The 30-day line reacts fast; the 180-day line shows the regime.

Volatility clusters: calm periods and violent periods each persist. Historically, multi-month volatility compression (all three lines low and converging) has preceded large directional moves — the coiled-spring pattern — while volatility peaks coincide with capitulations and blow-off tops. The long-term trend is also visibly downward as the asset matures.

[View live chart →](https://burrito-finance.vercel.app/charts/volatility)

## Golden/Death Crosses

*Golden crosses (50d SMA over 200d) and death crosses (under) marked on price.*

A golden cross is the 50-day SMA crossing above the 200-day SMA; a death cross is the reverse. Markers show each event on the price history with both averages plotted.

The classical reading — golden bullish, death bearish — is right about half the time in crypto, because the signal lags: crosses confirm a trend that is already months old, and choppy markets produce whipsaws (a cross followed quickly by its opposite). The interesting historical pattern is that death crosses have often landed near local bottoms rather than before further decline.

[View live chart →](https://burrito-finance.vercel.app/charts/golden-death-crosses)

## MACD

*Momentum read from the gap between fast and slow EMAs, with signal line and histogram.*

MACD is the gap between the 12- and 26-day EMAs (the orange line), with a 9-day EMA of that gap as the signal line, and the histogram showing their difference. Positive and rising = accelerating upward momentum.

The standard signals: MACD crossing its signal line (short-term momentum shifts) and zero-line crossings (trend direction changes). On an asset this volatile the daily MACD fires often — the higher-value readings are divergences at extremes, where price makes a new high or low that the MACD refuses to confirm.

[View live chart →](https://burrito-finance.vercel.app/charts/moving-average-convergence-divergence)

## Bollinger Bands

*A 20-day average with ±2σ bands that widen and squeeze with volatility.*

The bands sit two standard deviations above and below a 20-day moving average, so they widen when volatility rises and squeeze when it falls. Roughly 95% of closes fall inside them by construction.

Two classic reads: the squeeze (unusually narrow bands mark volatility compression that tends to resolve violently) and band walks (in strong trends price rides the upper or lower band for weeks — touching a band is not by itself a reversal signal).

[View live chart →](https://burrito-finance.vercel.app/charts/bollinger-bands)

## Pi Cycle Bottom/Top

*The cycle-top signal that fires when the 111-day SMA crosses twice the 350-day SMA.*

When the fast 111-day SMA crosses above twice the 350-day SMA, the Pi Cycle Top has historically flagged cycle peaks with eerie precision — within days of the 2013, 2017 and 2021 tops. The name comes from 350/111 ≈ π.

It is a curve-fit discovery, not a theory — there is no economic reason the ratio should be π — so treat each new cycle as an out-of-sample test. It fires rarely (a handful of events in 15 years), which is exactly what makes it worth marking on the chart.

[View live chart →](https://burrito-finance.vercel.app/charts/pi-cycle-bottom-top)
