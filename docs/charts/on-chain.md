---
title: On-Chain Charts
tags: [burrito, charts, on-chain]
---

# On-Chain Charts

10 charts. Part of the [[charts/index|chart reference]].

## MVRV

*Market cap divided by realized cap — price relative to the market's aggregate cost basis.*

Realized cap values every coin at the price it last moved on-chain, making it the market's aggregate cost basis. MVRV is market cap divided by that: above 1, the average holder is in profit; below 1, underwater. It's the on-chain cousin of the risk metric — valuation measured from actual coin movements instead of price trend.

Historically, MVRV above ~3.5 marked euphoric tops (2013, 2017, 2021) and dips below 1 marked capitulation bottoms where the average market participant held at a loss. Today's reading near 1.2 sits in the low accumulation band. Realized cap here is derived as market cap ÷ Coin Metrics' MVRV series, since the raw series is paywalled — same number, different arithmetic.

[View live chart →](https://burrito-finance.vercel.app/charts/mvrv)

## MVRV Z-Score

*Market cap minus realized cap, in standard deviations of their historical gap.*

The Z-score version of MVRV: instead of a ratio, it measures how many standard deviations the gap between market cap and realized cap sits from its historical average. This normalization makes extremes comparable across cycles despite Bitcoin's growth.

Readings above ~7 flagged every cycle top within weeks; readings near or below 0 marked the deep-value zones of 2011, 2015, 2018 and 2022. It's slower and steadier than price-based oscillators because realized cap only moves when coins actually change hands.

[View live chart →](https://burrito-finance.vercel.app/charts/mvrv-z-score)

## NUPL

*Net unrealized profit/loss: the share of market cap that is unrealized gain.*

NUPL is (market cap − realized cap) ÷ market cap: the fraction of Bitcoin's value that exists as paper profit. At 0.75, three quarters of the market cap is unrealized gain (historic euphoria); below 0, the market in aggregate holds at a loss (historic capitulation).

The classic band labels — belief above 0.5, optimism 0.25–0.5, hope/fear around 0–0.25, capitulation below 0 — map cleanly onto past cycles. NUPL is algebraically 1 − 1/MVRV, so the two charts always agree; NUPL just reads more intuitively as "percent of the market that is profit."

[View live chart →](https://burrito-finance.vercel.app/charts/nupl)

## Puell Multiple

*Daily issuance value divided by its 365-day moving average.*

The Puell Multiple measures miner revenue stress: the USD value of newly issued coins today versus its one-year average. High values mean mining is extraordinarily profitable (historically at cycle tops); low values mean miners earn far below trend (capitulation zones, where weak miners shut off).

Sub-0.5 readings marked the 2015, 2018 and 2022 bottoms; readings above ~4 flagged tops. Halvings mechanically cut the numerator in half, which is why each halving briefly craters the multiple — the market has historically re-rated price upward over the following year, restoring it.

[View live chart →](https://burrito-finance.vercel.app/charts/puell-multiple)

## Stock to Flow (S2F)

*Current supply divided by annualized issuance — Bitcoin's scarcity ratio.*

Stock-to-flow divides what exists (supply) by what's produced per year (flow). Each halving doubles the ratio in one step — the staircase in the line. Bitcoin's S2F now exceeds 100, i.e. over a century of current production to replicate the existing supply, putting it beyond gold (~60).

The infamous S2F price model (scarcity → price power law) overshot badly after 2021 and is widely considered broken; we chart the ratio itself, which is just arithmetic fact, alongside price for context — scarcity rises on schedule regardless of what price does with it.

[View live chart →](https://burrito-finance.vercel.app/charts/stock-to-flow)

## Supply Issued & Inflation

*Daily issuance in USD and the annualized supply inflation rate.*

Two views of new supply: the dollar value of coins issued each day (what miners can sell), and the annualized inflation rate of the supply. Bitcoin's inflation is now ~0.8%/yr — below gold's and most fiat targets — and halves again every four years.

The issuance line in USD is what actually pressures price: it's the daily sell-side flow the market must absorb at worst. Post-2024-halving it runs around $20–30M/day — down from over $50M equivalent at the 2021 cycle's rate.

[View live chart →](https://burrito-finance.vercel.app/charts/issuance)

## Ethereum Supply Dynamics vs Bitcoin

*Circulating supply of ETH and BTC over time.*

BTC's supply follows a fixed asymptote toward 21M — the smooth flattening curve. ETH's is policy-driven: fast early inflation, slowed by successive issuance cuts, then post-Merge (Sep 2022) burn mechanics that made it roughly flat and at times deflationary.

The contrast is the point: one asset's monetary policy is an algorithm frozen in 2009; the other's is an evolving social agreement. Both charts are plain supply counts — no USD anywhere.

[View live chart →](https://burrito-finance.vercel.app/charts/supply-eth-btc)

## Address Activity

*Daily count of unique active addresses on Bitcoin and Ethereum.*

Active addresses are the closest thing to a daily-users metric that a public ledger offers — every address that sent or received that day. It's a network-usage pulse independent of price.

Divergences are the signal: usage holding firm through a price crash (2019, 2023) has marked durable bottoms, while price rallying on flat activity is the on-chain version of low-volume rallies. Caveats: one entity can control thousands of addresses, and exchange batching distorts levels — trends matter, absolutes don't.

[View live chart →](https://burrito-finance.vercel.app/charts/address-activity)

## Transfer Count Statistics

*Daily on-chain transactions and value-transfer counts for Bitcoin.*

Two counts: total transactions (every on-chain operation) and transfers (those that actually moved value between distinct parties). The gap between them reflects batching, consolidation, and protocol overhead like inscriptions.

Throughput on Bitcoin's base layer is capacity-bound (~300–700k tx/day), so this chart saturates rather than trends — spikes above the band usually mean fee events (2017, 2023 inscriptions), while collapses mark demand droughts.

[View live chart →](https://burrito-finance.vercel.app/charts/transfer-count-statistics)

## Transaction Fees

*Total daily fees paid on Bitcoin and Ethereum, in USD.*

Fees are the purest demand signal a chain has: what users actually pay for block space. Log scale, because fee days range from thousands of dollars to the $70M+ frenzy days of 2017 and 2021.

The two chains tell different stories: Bitcoin fees spike episodically (bull manias, inscription waves) on an otherwise low base; Ethereum's fee floor is structurally higher from DeFi/NFT activity but has fallen an order of magnitude since L2s absorbed volume. Fee droughts historically coincide with bear-market apathy phases.

[View live chart →](https://burrito-finance.vercel.app/charts/transaction-fees)
