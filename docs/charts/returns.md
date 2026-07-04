---
title: Returns Charts
tags: [burrito, charts, returns]
---

# Returns Charts

10 charts. Part of the [[charts/index|chart reference]].

## Best Day To DCA

*Whether any weekday has historically offered cheaper buys relative to trend.*

Each bar is the average extension of price above its 50-day SMA for that weekday, across the full history. The weekday with the lowest average extension has, historically, offered slightly cheaper buys relative to trend.

Honest framing: the differences are tiny — fractions of a percent against daily volatility measured in whole percents. If a weekday edge exists (weekend closes have historically been marginally softer), it's a tie-breaker for an existing DCA habit, not a strategy.

[View live chart →](https://burrito-finance.vercel.app/charts/best-day-to-dca)

## Running ROI (1y)

*Rolling 1-year return on investment, in percent.*

Each point answers one question: if you had bought exactly one year earlier, what would your return be today? A reading of +150% means price is 2.5× what it was a year ago; −50% means it halved.

The chart makes Bitcoin's cyclicality unmissable: the 1-year ROI oscillates in huge waves, from several-hundred-percent peaks in bull manias to −70%+ troughs in bear-market capitulations. The zero line is the regime boundary — extended time below it has historically been the accumulation phase, and the steep climbs off the lows mark new cycle beginnings.

Note the diminishing amplitude across cycles: early peaks reached +9,000%, recent ones in the hundreds. That decay of returns as Bitcoin's market cap grows is one of the core arguments behind the log-regression approach used elsewhere on this site.

[View live chart →](https://burrito-finance.vercel.app/charts/running-roi)

## YTD ROI

*Year-to-date return for each calendar year, overlayable to compare how different years unfolded.*

Each line tracks one calendar year's cumulative return, starting from that year's first close (0% on the year's first trading day). All years are drawn on a shared January-to-December axis, so you can overlay any set of them and compare their paths day by day.

Use the year pills to toggle years on and off, or the presets to jump to a cycle view. Overlaying halving years (2012, 2016, 2020, 2024) reveals how similar their second-half accelerations were; post-halving years (2013, 2017, 2021, 2025) and bear years (2014, 2018, 2022) each have their own recognizable shapes. The presidential presets slice the same calendar by the US political cycle — and note the coincidence: election years and halving years are the same years, so the two 4-year rhythms are perfectly in phase, with pre-election years being the one phase the crypto presets don't cover.

Reading tip: the absolute levels matter less than the shape. Years that spent H1 flat and exploded in Q4 look very different from years that front-loaded their gains — and where the current year sits inside that family of shapes is a quick sanity check on cycle narratives.

[View live chart →](https://burrito-finance.vercel.app/charts/ytd-roi)

## Quarterly Returns

*Close-to-close returns for each calendar quarter across the full history.*

Each cell is one quarter's return, measured from the prior quarter's final daily close. Green closed up, red closed down, intensity scaled to the size of the move.

Quarters smooth out the noise that monthly cells still carry: Q4's historical strength and Q3's weakness stand out clearly, and each year compresses into four readable numbers. Q2 2011 or Q1 2013 style outliers also make it obvious which quarters defined their entire cycle.

[View live chart →](https://burrito-finance.vercel.app/charts/quarterly-returns)

## Monthly Average ROI

*The average return of each calendar month across all years.*

Each bar averages every January, every February, and so on across Bitcoin's full history — the long-run seasonal fingerprint of the market.

Averages hide variance: a +10% average month can still lose money four years out of ten. Read this next to the Monthly Returns heatmap, which shows the spread behind each bar. Small-sample caveat applies — there are only ~15 observations per month.

[View live chart →](https://burrito-finance.vercel.app/charts/monthly-average-roi)

## Historical Monthly ROI by Year

*Each month's return shown separately for every year.*

The grouped bars break the Monthly Average ROI apart: within each month, one bar per year. This shows the distribution behind the seasonal average — how often October actually delivered, and how wild the spread is.

Hover any bar for its exact year and value. The dominance of a few enormous early-cycle months (2011–2013) is a useful reminder of why averages alone mislead.

[View live chart →](https://burrito-finance.vercel.app/charts/historical-monthly-average-roi)

## Average Daily Returns

*Bitcoin's average daily move for each calendar day of the month.*

Each bar is the average daily % change for that day of the month across all years — day 1 averages every 1st of the month in history, and so on.

This is the chart behind "best day to DCA" folklore. The honest reading: differences between days are small relative to daily volatility, so treat any pattern here as weak evidence — which is itself useful to know before over-optimizing a DCA schedule.

[View live chart →](https://burrito-finance.vercel.app/charts/average-daily-returns)

## Price Drawdown From ATH

*How far price sits below the highest close ever reached.*

The line shows how far price sits below the highest close ever reached up to that point. Zero means a new all-time high; the deep troughs are the bear-market capitulations (−93% in 2011, −84% in 2015, −83% in 2018, −77% in 2022).

Two uses: gauging where the current decline ranks against history, and internalizing Bitcoin's true risk profile — every cycle so far has spent years more than 50% below its high. Note the progressively shallower cycle lows, consistent with a maturing (lower-volatility) asset.

[View live chart →](https://burrito-finance.vercel.app/charts/price-drawdown-ath)

## Altcoin Season Index

*The share of tracked altcoins outperforming Bitcoin over the trailing 90 days.*

For each day, the index asks: what fraction of tracked altcoins beat Bitcoin's return over the previous 90 days? Above 75 is conventionally "altcoin season"; below 25 is "Bitcoin season."

Alt seasons are the euphoric late phase of bull markets — capital rotating down the risk curve — and they historically cluster just before cycle tops, which makes this as much a warning gauge as a celebration. Our universe is the ~27 tracked alts rather than the top-50 ITC uses, so exact values differ slightly; the regime signal is the same.

[View live chart →](https://burrito-finance.vercel.app/charts/altcoin-season-index)

## Monthly Returns

*Month-by-month close-to-close returns across the full history.*

Each cell is one month's return, measured close-to-close from the prior month's final daily close. Green months closed up, red months closed down, and the color intensity scales with the size of the move (saturating at ±30%).

Scanning columns reveals Bitcoin's seasonal folklore and how real it is: October ("Uptober") and November have historically skewed green, September has skewed red, and the strongest months cluster in Q4. Scanning rows shows each year's character at a glance — the relentless green of 2013 and 2017, the almost unbroken red of 2018 and 2022.

Seasonality in crypto is a weak effect layered on top of the cycle: a September in a raging bull market is still more likely green than an October in a deep bear. Use this as context, not as a signal on its own.

[View live chart →](https://burrito-finance.vercel.app/charts/monthly-returns)
