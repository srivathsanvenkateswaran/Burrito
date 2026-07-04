---
title: Cycles Charts
tags: [burrito, charts, cycles]
---

# Cycles Charts

13 charts. Part of the [[charts/index|chart reference]].

## ROI After Halving

*Price multiples following each of Bitcoin's four halvings, overlaid day by day.*

Each line starts at 1× on a halving day (2012, 2016, 2020, 2024) and tracks the multiple of that day's price forward, on a shared days-since axis with a logarithmic y-axis — without the log scale, 2012's 90× would flatten every later cycle into invisibility. This is the chart behind the entire halving-cycle thesis: historically, the 12–18 months after each halving contained the bulk of the cycle's gains.

Note the shrinking amplitude — each successive halving cycle has delivered a smaller multiple, consistent with diminishing returns as market cap grows. Comparing the current halving line against its predecessors at the same day-count is the cleanest "where are we in the cycle" view this framework offers.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-halving)

## ROI After Cycle Bottom

*Recovery paths from each bear-market low, overlaid on a shared timeline.*

Each line starts at 1× on a bear-market bottom (2011, 2015, 2018, 2022) and shows the recovery multiple from that low on a days-since axis (log scale, since early cycles reached 100×+). Bottoms are only knowable in hindsight, so the anchor dates are fixed historical lows, not predictions.

The recoveries rhyme: roughly two years of choppy appreciation, then a steep leg. Overlaying the current cycle on the old ones shows whether the market is running hot or cold against its own precedent — and the shrinking peak multiples echo the same diminishing-returns story as the halving chart.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-cycle-bottom)

## ROI After Cycle Peak

*Drawdown-and-recovery paths from each cycle top, overlaid day by day.*

The mirror image of ROI After Cycle Bottom: each line starts at 1× on a cycle top (2011, 2013, 2017, 2021, 2025) and tracks the drawdown-and-recovery multiple from that day, on a log axis so the deep-drawdown region stays readable next to the eventual recoveries. It answers the question every top-buyer asks: how long until break-even?

History's answer has been two to three years underwater, with the depth of the trough shrinking each cycle. It's also the best illustration of why the risk metric emphasizes selling into strength — the cost of buying the top is measured in years, not percent.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-cycle-peak)

## ROI After Latest Cycle Peak (Multiple Coins)

*Each asset's multiple since the October 2025 market peak.*

Every line starts at 1× on 2025-10-06 — the latest cycle's ATH close — and tracks each asset's path through the current drawdown. Toggle assets to compare who is weathering it and who is collapsing.

Drawdown dispersion is a leadership signal: assets falling least from a shared peak tend to lead the next advance, while the deepest fallers historically either die or produce the most violent (and least reliable) bounces.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-latest-cycle-peak)

## ROI After Latest Peak (Crypto Pairs)

*Each asset against BTC since the October 2025 peak.*

The current drawdown in BTC terms: lines above 1× have outperformed Bitcoin since the top — rare in down markets, since capital hides in BTC during fear.

Anything holding above 1× through a bear phase is showing genuine relative strength, the strongest single filter for next-cycle leadership that pair charts offer.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-latest-cycle-peak-for-crypto-pairs)

## Cycles Deviation

*How far the current cycle's ROI deviates from the average of past cycles.*

The line is the current cycle's return (from the 2022 bottom) minus the average return of the three prior cycles at the same day-count. Above zero: running hotter than the historical average; below: colder.

It compresses the whole overlay-the-cycles exercise into one series. Persistent negative deviation is the quantitative form of the "lengthening/weakening cycles" argument; a crossover back above zero would mean the current cycle started outperforming its precedent.

[View live chart →](https://burrito-finance.vercel.app/charts/cycles-deviation)

## ROI Bands

*The amount of days it took to 2×, 4×, 10× and 100× a purchase from each date.*

For every historical buy date, the lines show how many days that purchase took to double, 4×, 10×, or 100× — with gaps where it simply never happened (yet). The y-axis is days, so lower means faster.

The pattern is stark: buys made in bear-market depths multiplied within a few hundred days, while buys near tops show multi-thousand-day waits or open gaps. The 100× line ends early — no purchase after 2013 has ever 100×'d, the bluntest possible statement of diminishing returns.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-bands)

## SMA Cycle-Top Breakout

*Marks where the 20W SMA crosses above the previous cycle's top price.*

Each marker flags the day the 20-week SMA — not price itself, but its smoothed trend — climbed above the previous cycle's peak close. Price crosses old highs many times amid volatility; the slow average doing it is a stronger statement that the market has durably outgrown the last cycle.

Historically these breakouts have landed early in the steep phase of bull markets (2013, 2017, 2021), making this one of the simpler regime-confirmation signals in the cycle toolkit.

[View live chart →](https://burrito-finance.vercel.app/charts/sma-cycle-top-breakout)

## ROI After Bottom (Multiple Coins)

*Each asset's multiple from the November 2022 cycle bottom.*

Every line starts at 1× on 2022-11-21 — the cycle low — and tracks that asset's multiple since, on a log axis. Toggle assets to compare recoveries.

Dispersion is the story: the same bottom produced wildly different recoveries, and the ranking reshuffles between market phases. BTC leading the early recovery with alts catching up later (or never) is the classic post-bottom sequence.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-bottom-comparison)

## ROI After Bottom (Crypto Pairs)

*Each asset's performance against BTC since the November 2022 bottom.*

Same anchor as the multiple-coins chart, but every line is the asset's BTC pair — above 1× means it beat Bitcoin since the bottom, below means it lagged. This strips out the market's beta and leaves pure relative strength.

Far fewer lines hold above 1× here than on the USD version — the recurring lesson of pair charts. The ones that do are the cycle's genuine outperformers rather than passengers.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-cycle-bottom-for-crypto-pairs)

## ROI After Inception (Multiple Coins)

*Each asset's multiple since its own first trading day, on a shared days axis.*

All assets aligned at day 0 = their Binance listing, tracking the multiple since. This normalizes for age: a 2017 coin and a 2023 coin can be compared at the same point in their lifecycle.

Two patterns recur: early listings during bull markets start with a crash (listing pops fade), and the long-run distribution is brutally skewed — a few compounders, many round-trips to zero-ish. Day-matched comparison shows whether a young coin is tracking a compounder's path or a bleeder's.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-inception-comparison)

## ROI After Inception (Crypto Pairs)

*Each asset against BTC since its own listing day.*

The inception chart in BTC terms: from each asset's first day, did holding it beat just holding Bitcoin? Lines below 1× — the majority, most of the time — answer no.

This is the cleanest long-horizon version of the alts-vs-BTC question, aligned by asset age instead of calendar. The handful of lines that sustain above 1× for years are the short list of alts that have genuinely compounded against BTC.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-inception-for-crypto-pairs)

## ROI After Sub-Cycle Bottom (ETH)

*Ethereum's recovery multiple from each of its major lows.*

Ethereum's cycle lows don't always coincide with Bitcoin's — the 2020 COVID crash and the mid-2022 capitulation were ETH-specific extremes. Each line tracks ETH's multiple from one of those lows, plus its latest 400-day low, on a shared days axis.

Comparing the current recovery against 2018/2020/2022 paths answers whether ETH is tracking its own historical rhythm or breaking it — relevant right now, with ETH's latest drawdown deeper than BTC's.

[View live chart →](https://burrito-finance.vercel.app/charts/roi-after-sub-cycle-bottom)
