---
title: Valuation Charts
tags: [burrito, charts, valuation]
---

# Valuation Charts

1 charts. Part of the [[charts/index|chart reference]].

## Mayer Multiple

*Price divided by the 200-day SMA. Historically hot above 2.4, cheap below 0.8.*

The Mayer Multiple, named after Trace Mayer, is simply the current price divided by its 200-day simple moving average. At 1.0, price sits exactly on its long-term trend; at 2.0 it is double the trend; below 1.0 it trades under it.

The classic thresholds come from backtests over Bitcoin's history: buying when the multiple exceeded 2.4 has historically produced poor forward returns (price far above trend, late in a rally), while readings below 0.8 marked the deep-value zones of bear markets. The multiple mean-reverts: extended periods above 2 have always been followed by a return to the 200-day average.

Its weakness is the same as any moving-average metric: after a violent crash the 200-day SMA itself falls, so the multiple can look "normal" while the market is still damaged. Read it together with the risk metric, which uses a much slower baseline.

[View live chart →](https://burrito-finance.vercel.app/charts/mayer)
