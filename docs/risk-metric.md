---
title: The Risk Metric & Quantile Fan
tags: [burrito, methodology, risk]
---

# The Risk Metric & Quantile Regression Fan

Burrito's flagship number is a **0–1 risk score**: how expensive is price *right now*,
relative to the asset's entire trend history? This page explains exactly how it's computed —
no black box.

## The idea

Bitcoin's long-run price is well described in **log-log space**: log price versus log time
since inception. But a single best-fit line (least squares) gets dragged around by bubbles
and tells you nothing about the *distribution* of price around trend. So instead of one
line, we fit **nine**.

## The fan

For quantiles τ ∈ {0.01, 0.05, 0.15, 0.30, 0.50, 0.70, 0.85, 0.95, 0.99} we fit a separate
**quadratic quantile regression**:

    ln(price) = a + b·z + c·z²      where z = standardized ln(days since inception)

Each fit minimizes **pinball loss** (the quantile-regression objective) via gradient
descent (Adam, ~4000 steps), initialized from the ordinary least-squares fit shifted to the
residual quantile. Because each quantile is fitted independently, the fan can be
**asymmetric** — wider above the median than below, like Bitcoin's actual return
distribution. Finally the curves are **rearranged** (sorted at every date) so quantiles
can never cross.

- The **τ = 0.50 curve is fair value** — the median trend.
- The **τ = 0.01 curve** hugs the historical floor: every major bottom touched it.
- The **τ = 0.99 curve** bounds mania.

## From fan to risk score

**Risk = the interpolated quantile position of today's price inside the fan.** If price
sits on the median curve, risk = 0.50; on the 95th-percentile curve, 0.95; below the 1st
percentile, 0.01. Linear interpolation in log space between adjacent quantile curves.

## Calibration receipts

Fitted on full history and read back at known reference points:

| Event | Risk reading |
|---|---|
| Nov 2013 top | 0.99 |
| Dec 2017 top | 0.99 |
| Nov 2021 top | 0.98 |
| Oct 2025 top | 0.92 |
| Dec 2018 bottom | 0.22 |
| Nov 2022 bottom | 0.01 |

No parameters were tuned *to* these points — they fall out of the fit.

## Per-asset fans

Every tracked asset gets its own fan, fitted to its own history (time measured from its
first trading day). Assets with under two years of history are flagged — a fan fitted to
one partial cycle is a sketch, not a model. See the [[charts/risk|risk chart family]] and
the Risk Dashboard.

## Honest limitations

- **Refit daily on full history** — all readings shift slightly as data arrives; the model
  has hindsight the past didn't have. Extremes are meaningful; mid-range is noise.
- **Trend extrapolation** — the fan assumes the log-log growth regime persists. A true
  regime break (hyperbitcoinization or obsolescence) invalidates it in either direction.
- **It's a valuation dial, not a timer** — price can ride the 0.9 band for months.
- Related further reading: [[data-pipeline]] for where the price series comes from.
