# 🌯 burrito

every market, one tortilla — a personal quantitative market-analysis site
(crypto, equities, metals, macro) inspired by Into The Cryptoverse.

Full project plan: `../PLAN.md`.

## How it works

- **No live API calls from the site.** Historical daily data is immutable, so it's
  fetched once, stored in the repo, and only appended to.
- `data/raw/<asset>/daily.json` — raw daily OHLCV, one row per line (clean git diffs).
- `scripts/backfill.ts` — one-time full-history fetch per asset
  (blockchain.info 2010→, overridden by Binance OHLCV where available).
- `scripts/update.ts` — appends missing closed UTC candles; runs daily via
  GitHub Actions (`.github/workflows/daily-update.yml`), which commits the new
  rows — pushing to a Vercel-connected repo redeploys the site automatically.

## Commands

```bash
npm run dev            # local dev server
npm run build          # production build (statically prerenders with stored data)
npm run data:backfill  # one-time history backfill
npm run data:update    # append latest closed daily candles
```

## Status

Phase 0 (vertical slice) done: BTC/USD daily history 2010→present, log-scale
chart, daily cron. Next up (Phase 1): log regression + bands, ROI bands, BMSB,
moving averages, monthly-returns heatmap — see the roadmap in `../PLAN.md`.
