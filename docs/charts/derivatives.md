---
title: Derivatives Charts
tags: [burrito, charts, derivatives]
---

# Derivatives Charts

4 charts. Part of the [[charts/index|chart reference]].

## Futures Open Interest

*Total value of outstanding BTC and ETH futures contracts on Binance.*

Open interest is the total capital locked in unsettled futures — the amount of leverage in the system. Rising OI with rising price means new longs are driving the move; rising OI into falling price means shorts are pressing; collapsing OI is liquidation, the deleveraging event.

OI extremes are fragility gauges: record OI means a crowded, liquidation-prone market where a small move cascades. Data note: Binance only exposes ~30 days retroactively, so this chart's history accumulates daily from July 2026 — it deepens the longer the site runs.

[View live chart →](https://burrito-finance.vercel.app/charts/futures-open-interest)

## Options Open Interest

*Notional value of outstanding BTC and ETH options on Deribit.*

Deribit clears the large majority of crypto options; this is the notional value of all its outstanding contracts. Options OI clusters around monthly and quarterly expiries — the sawtooth as big expiries roll off is normal, not a signal.

Options flows increasingly drive spot around expiry (max-pain gravitation, dealer hedging), which is why the absolute level matters: BTC options at ~$22B notional means the tail wags the dog more than in past cycles. Snapshot-based series — history accumulates daily from July 2026.

[View live chart →](https://burrito-finance.vercel.app/charts/options-open-interest)

## Long/Short Ratios

*Who's positioned long vs short on Binance futures — the biggest traders and the whole crowd.*

Three views of positioning: top traders by account count, top traders by position size, and the entire exchange. Above 1.0, more longs than shorts. The gap between the top-position and global lines is the smart-money-vs-crowd divergence.

The classic contrarian read: retail (global) crowding heavily long into a falling market marks capitulation fuel — their liquidations become the cascade. Top-position traders leaning opposite the crowd have historically been the better-informed side. Accumulating since July 2026 (Binance exposes 30 days).

[View live chart →](https://burrito-finance.vercel.app/charts/long-short-ratios)

## Long/Short Percentages

*The share of top-trader accounts positioned long vs short.*

The same top-trader data as the ratios chart, expressed as percentages that always sum to 100 — easier to read at a glance: 64% long means nearly two-thirds of Binance's biggest accounts are positioned for upside.

Extreme one-sidedness (75%+ either way) is the fragile state — when that many traders share a position, the exit is crowded. Persistent moderate long bias is the historical norm (crypto natives skew long); deviations from that norm carry the signal.

[View live chart →](https://burrito-finance.vercel.app/charts/long-short-percent)
