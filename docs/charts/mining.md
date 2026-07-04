---
title: Mining Charts
tags: [burrito, charts, mining]
---

# Mining Charts

7 charts. Part of the [[charts/index|chart reference]].

## Hash Rate

*The Bitcoin network's total mining computation rate.*

Hash rate is the physical security budget of Bitcoin — the aggregate computation racing to produce blocks, now above 1,000 EH/s (a billion terahashes per second). Log scale: it has grown ~15 orders of magnitude since 2009.

Hash rate follows price with a lag (mining investment chases profitability) but falls far more reluctantly — hardware, once bought, keeps running until it's unprofitable at the margin. Sustained hash-rate declines are rare and mark genuine miner capitulation events.

[View live chart →](https://burrito-finance.vercel.app/charts/hash-rate)

## Hash Ribbons

*30d vs 60d moving averages of hash rate; crossovers mark miner capitulation and recovery.*

When the 30-day average of hash rate drops below the 60-day, miners are switching off at scale — capitulation. When it crosses back above, the weakest miners are gone and the survivors are healthy — recovery. The recovery cross is the famous buy signal.

The logic is Darwinian: miner capitulation clusters near price bottoms because miners are the market's most informed forced sellers; when even they stop capitulating, sell pressure exhausts. The signal fired well in 2019, 2020, and post-China-ban 2021; like all rare signals, it has few data points.

[View live chart →](https://burrito-finance.vercel.app/charts/hash-ribbons)

## Hash Rate / Price

*Hash rate divided by price — mining effort per dollar of Bitcoin.*

This ratio asks how much security the network provides per dollar of price. Rising ratio means hash rate is outgrowing price (mining margins compressing); falling means price is outrunning the miners.

Extremes are contrarian markers: ratio peaks (maximum mining effort per dollar) have coincided with price bottoms — hash rate held up while price collapsed — and troughs with manias where price sprinted ahead of infrastructure.

[View live chart →](https://burrito-finance.vercel.app/charts/hash-over-price)

## Miner Revenue

*Total daily miner income: block subsidies plus transaction fees, in USD.*

Everything miners earn per day. The subsidy portion halves every four years, so the long-term survival question for mining economics is whether fees grow into the gap — so far, fee share remains small outside congestion events.

Miner revenue is also the market's most reliable structural sell pressure (miners pay electricity in fiat), which is why revenue extremes echo through price: the Puell Multiple and the thermocap ratios on this site are both built from this series.

[View live chart →](https://burrito-finance.vercel.app/charts/miner-revenue)

## MarketCap / ThermoCap (MCTC)

*Market cap divided by cumulative all-time miner revenue.*

Thermocap is every dollar ever paid to miners — the cumulative security spend, a proxy for total resources sunk into producing Bitcoin. MCTC asks: how many times over does the market value the network versus what it cost to secure it?

Tops have historically stretched MCTC into the 30s+ (2013 far higher); bear bottoms compressed it toward single digits. Because thermocap only ever grows, the ratio has a natural downtrend across epochs — compare against recent cycles, not 2011.

[View live chart →](https://burrito-finance.vercel.app/charts/mcap-thermocap)

## RealizedCap / ThermoCap (RCTC)

*Realized cap divided by cumulative miner revenue.*

The steadier sibling of MCTC: realized cap (the market's cost basis) over thermocap (the security spend). Because both numerator and denominator move slowly, RCTC filters out price noise and shows the structural relationship between capital stored in Bitcoin and capital spent securing it.

Rising RCTC means holders' aggregate cost basis is compounding faster than mining expenditure — long-term adoption outpacing security cost. Its cycle swings are gentle; sharp moves are rare and worth attention.

[View live chart →](https://burrito-finance.vercel.app/charts/rcap-thermocap)

## Block Statistics

*Daily block count and average block size.*

Block count per day hovers around 144 (one per ten minutes) with drift from difficulty lag — sustained deviations reveal hash rate shocks between difficulty adjustments. Average block size shows how full blocks run.

Block size tells the demand story in slow motion: the climb to the 1MB wall (2016-17), SegWit's effective-size relief, and the 2023+ inscription era pinning blocks near capacity. Full blocks plus rising fees = real block-space demand.

[View live chart →](https://burrito-finance.vercel.app/charts/block)
