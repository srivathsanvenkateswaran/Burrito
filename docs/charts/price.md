---
title: Price Charts
tags: [burrito, charts, price]
---

# Price Charts

1 charts. Part of the [[charts/index|chart reference]].

## Price + Moving Averages

*BTC/USD with toggleable overlays: log regression bands, Bull Market Support Band (20W SMA / 21W EMA), 50W and 200W SMAs.*

Bitcoin's long-term history only makes sense on a logarithmic scale: each gridline step is a multiplication (10×), not an addition. On a linear scale everything before 2017 flattens into a line at zero; on a log scale the early $1 → $100 move is given the same visual weight as $1,000 → $100,000, which is how returns actually compound.

The log regression line is a best-fit curve through the entire price history in log-log space (log of price against log of time since Bitcoin's genesis block). It is a slow-moving estimate of fair value; the shaded band around it is one standard deviation of how far price has historically strayed. Price spends years above and below this line — the point is not that price follows it, but that price has always eventually reverted toward it.

The Bull Market Support Band (20-week SMA and 21-week EMA) is the zone that has repeatedly acted as support during bull markets and resistance during bear markets. Weekly closes above a rising band have historically indicated bull conditions. The 50W and 200W SMAs are the longer-term regime lines: the 200W SMA in particular has marked every major cycle bottom to date.

[View live chart →](https://burrito-finance.vercel.app/charts/price)
