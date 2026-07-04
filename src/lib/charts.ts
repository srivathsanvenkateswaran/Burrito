export interface ChartDef {
  slug: string;
  title: string;
  category: string;
  description: string;
  /** Longer educational text rendered below the chart, one string per paragraph. */
  explanation: string[];
}

export const CHARTS: ChartDef[] = [
  {
    slug: "price",
    title: "Price + Moving Averages",
    category: "Price",
    description:
      "BTC/USD with toggleable overlays: log regression bands, Bull Market Support Band (20W SMA / 21W EMA), 50W and 200W SMAs.",
    explanation: [
      "Bitcoin's long-term history only makes sense on a logarithmic scale: each gridline step is a multiplication (10×), not an addition. On a linear scale everything before 2017 flattens into a line at zero; on a log scale the early $1 → $100 move is given the same visual weight as $1,000 → $100,000, which is how returns actually compound.",
      "The log regression line is a best-fit curve through the entire price history in log-log space (log of price against log of time since Bitcoin's genesis block). It is a slow-moving estimate of fair value; the shaded band around it is one standard deviation of how far price has historically strayed. Price spends years above and below this line — the point is not that price follows it, but that price has always eventually reverted toward it.",
      "The Bull Market Support Band (20-week SMA and 21-week EMA) is the zone that has repeatedly acted as support during bull markets and resistance during bear markets. Weekly closes above a rising band have historically indicated bull conditions. The 50W and 200W SMAs are the longer-term regime lines: the 200W SMA in particular has marked every major cycle bottom to date.",
    ],
  },
  {
    slug: "risk",
    title: "Risk Metric",
    category: "Risk",
    description:
      "0–1 risk score: price's percentile position inside the quantile regression fan. v2.",
    explanation: [
      "The risk metric compresses \"how stretched is price right now?\" into a single number between 0 and 1. Version 2 reads it directly off the quantile regression fan: if price sits on the fan's median curve, risk is 0.5; on the 95th-percentile curve, 0.95. It is the statistical answer to \"how expensive is today relative to Bitcoin's entire trend history?\"",
      "How to use it: low readings (green, below 0.2) have historically coincided with bear-market bottoms and accumulation zones; high readings (red, above 0.8) with euphoric tops where risk-reward favors taking profit. Backtested against known reference points, v2 scores the 2013/2017/2021 tops at 0.98–0.99 and the 2022 bottom at 0.01. It is a slow valuation signal, not a trade timer.",
      "Caveats: this is our own model — same family of methods ITC describes (asymmetric quantile regression), but independently fitted. The fan is refit on the full history each day, so all readings shift slightly as new data arrives; extremes are meaningful, mid-range is noise.",
    ],
  },
  {
    slug: "asymmetric-quantile-regression-fan",
    title: "Quantile Regression Fan",
    category: "Risk",
    description:
      "Fan chart from asymmetric quadratic quantile regression — the model behind the risk metric.",
    explanation: [
      "Each curve is a separate quadratic quantile regression of log price against log time: the 0.50 curve is the median trend (fair value), while the 0.01 and 0.99 curves bound the historically cheapest and most euphoric extremes. Unlike a least-squares fit, quantile regression is robust to bubbles — the median curve ignores outliers instead of being dragged by them — and fitting each quantile separately lets the fan be asymmetric, wider above than below, like Bitcoin's actual return distribution.",
      "Every band is fit on the full history and rearranged so curves can't cross. Price touching the lower curves has marked every major bottom; riding the upper curves, every mania phase. The risk metric is literally price's interpolated position between these curves.",
      "This mirrors the methodology ITC now uses in place of its retired logarithmic regression (they describe theirs as a \"rearranged asymmetric quadratic quantile regression\") — ours is an independent implementation of the same idea, so the exact curves will differ.",
    ],
  },
  {
    slug: "risk-colorcoded",
    title: "Price Color Coded By Risk",
    category: "Risk",
    description: "The full price history, colored by the risk metric at each point in time.",
    explanation: [
      "Same data as the Risk Metric chart, painted directly onto price: green stretches are low-risk accumulation zones, red stretches are euphoric extension. The mapping makes the strategy visceral — the green you'd want to have bought is always at the bottom of crashes, which is exactly when buying feels worst.",
      "This is also the fastest way to sanity-check the risk model itself: red lining up with the 2013/2017/2021 tops and green with the 2015/2018/2022 bottoms is exactly the calibration the quantile-fan version of the metric was chosen for.",
    ],
  },
  {
    slug: "risk-time",
    title: "Time In Risk Bands",
    category: "Risk",
    description: "The number of days price has spent in each risk band.",
    explanation: [
      "Each bar counts the days spent in one 0.1-wide risk band across the full history. The shape tells you what \"normal\" looks like: most of Bitcoin's life is spent mid-band, and the extreme bands are rare by construction.",
      "Practical use: it calibrates patience. If the sub-0.1 band holds only a small fraction of all days, then deep-value windows are short — when the metric gets there, hesitation has historically been expensive. The same logic applies in reverse for the 0.9+ band.",
    ],
  },
  {
    slug: "risk-levels",
    title: "Current Risk Levels",
    category: "Risk",
    description: "Today's risk bands projected onto the price scale.",
    explanation: [
      "The horizontal lines answer \"what price would move risk to 0.3? To 0.8?\" — each line is the price that corresponds to a given risk level under today's model state, drawn over the recent price action.",
      "This turns the risk metric into a planning tool: instead of watching the score, you can set alerts or ladder orders at the prices where your strategy says to act. The levels drift slowly as the regression and the trailing window update, so they're stable enough to plan around week to week.",
    ],
  },
  {
    slug: "short-term-bubble-risk",
    title: "Short Term Bubble Risk",
    category: "Risk",
    description: "Risk metric based on the extension from the 20W moving average.",
    explanation: [
      "Where the main risk metric measures extension from a multi-year fair value, this one measures extension from the 20-week SMA — the same baseline as the Bull Market Support Band — percentile-ranked the same way. It captures short-term froth rather than cycle-scale valuation.",
      "The two risks disagree in useful ways: mid-bull, cycle risk can be moderate while short-term bubble risk pins near 1.0 after a vertical few weeks — historically a local-top warning even when the larger trend had further to run.",
    ],
  },
  {
    slug: "roi-after-halving",
    title: "ROI After Halving",
    category: "Cycles",
    description: "The return on investment after each time the block mining reward is halved.",
    explanation: [
      "Each line starts at 1× on a halving day (2012, 2016, 2020, 2024) and tracks the multiple of that day's price forward, on a shared days-since axis with a logarithmic y-axis — without the log scale, 2012's 90× would flatten every later cycle into invisibility. This is the chart behind the entire halving-cycle thesis: historically, the 12–18 months after each halving contained the bulk of the cycle's gains.",
      "Note the shrinking amplitude — each successive halving cycle has delivered a smaller multiple, consistent with diminishing returns as market cap grows. Comparing the current halving line against its predecessors at the same day-count is the cleanest \"where are we in the cycle\" view this framework offers.",
    ],
  },
  {
    slug: "roi-after-cycle-bottom",
    title: "ROI After Cycle Bottom",
    category: "Cycles",
    description: "The return on investment as measured from each market cycle bottom.",
    explanation: [
      "Each line starts at 1× on a bear-market bottom (2011, 2015, 2018, 2022) and shows the recovery multiple from that low on a days-since axis (log scale, since early cycles reached 100×+). Bottoms are only knowable in hindsight, so the anchor dates are fixed historical lows, not predictions.",
      "The recoveries rhyme: roughly two years of choppy appreciation, then a steep leg. Overlaying the current cycle on the old ones shows whether the market is running hot or cold against its own precedent — and the shrinking peak multiples echo the same diminishing-returns story as the halving chart.",
    ],
  },
  {
    slug: "roi-after-cycle-peak",
    title: "ROI After Cycle Peak",
    category: "Cycles",
    description: "The return on investment as measured from each market cycle peak.",
    explanation: [
      "The mirror image of ROI After Cycle Bottom: each line starts at 1× on a cycle top (2011, 2013, 2017, 2021, 2025) and tracks the drawdown-and-recovery multiple from that day, on a log axis so the deep-drawdown region stays readable next to the eventual recoveries. It answers the question every top-buyer asks: how long until break-even?",
      "History's answer has been two to three years underwater, with the depth of the trough shrinking each cycle. It's also the best illustration of why the risk metric emphasizes selling into strength — the cost of buying the top is measured in years, not percent.",
    ],
  },
  {
    slug: "roi-after-latest-cycle-peak",
    title: "ROI After Latest Cycle Peak (Multiple Coins)",
    category: "Cycles",
    description: "Each asset's multiple since the October 2025 market peak.",
    explanation: [
      "Every line starts at 1× on 2025-10-06 — the latest cycle's ATH close — and tracks each asset's path through the current drawdown. Toggle assets to compare who is weathering it and who is collapsing.",
      "Drawdown dispersion is a leadership signal: assets falling least from a shared peak tend to lead the next advance, while the deepest fallers historically either die or produce the most violent (and least reliable) bounces.",
    ],
  },
  {
    slug: "roi-after-latest-cycle-peak-for-crypto-pairs",
    title: "ROI After Latest Peak (Crypto Pairs)",
    category: "Cycles",
    description: "Each asset against BTC since the October 2025 peak.",
    explanation: [
      "The current drawdown in BTC terms: lines above 1× have outperformed Bitcoin since the top — rare in down markets, since capital hides in BTC during fear.",
      "Anything holding above 1× through a bear phase is showing genuine relative strength, the strongest single filter for next-cycle leadership that pair charts offer.",
    ],
  },
  {
    slug: "cycles-deviation",
    title: "Cycles Deviation",
    category: "Cycles",
    description: "How far the current cycle's ROI deviates from the average of past cycles.",
    explanation: [
      "The line is the current cycle's return (from the 2022 bottom) minus the average return of the three prior cycles at the same day-count. Above zero: running hotter than the historical average; below: colder.",
      "It compresses the whole overlay-the-cycles exercise into one series. Persistent negative deviation is the quantitative form of the \"lengthening/weakening cycles\" argument; a crossover back above zero would mean the current cycle started outperforming its precedent.",
    ],
  },
  {
    slug: "roi-bands",
    title: "ROI Bands",
    category: "Cycles",
    description: "The amount of days it took to 2×, 4×, 10× and 100× a purchase from each date.",
    explanation: [
      "For every historical buy date, the lines show how many days that purchase took to double, 4×, 10×, or 100× — with gaps where it simply never happened (yet). The y-axis is days, so lower means faster.",
      "The pattern is stark: buys made in bear-market depths multiplied within a few hundred days, while buys near tops show multi-thousand-day waits or open gaps. The 100× line ends early — no purchase after 2013 has ever 100×'d, the bluntest possible statement of diminishing returns.",
    ],
  },
  {
    slug: "sma-cycle-top-breakout",
    title: "SMA Cycle-Top Breakout",
    category: "Cycles",
    description: "Marks where the 20W SMA crosses above the previous cycle's top price.",
    explanation: [
      "Each marker flags the day the 20-week SMA — not price itself, but its smoothed trend — climbed above the previous cycle's peak close. Price crosses old highs many times amid volatility; the slow average doing it is a stronger statement that the market has durably outgrown the last cycle.",
      "Historically these breakouts have landed early in the steep phase of bull markets (2013, 2017, 2021), making this one of the simpler regime-confirmation signals in the cycle toolkit.",
    ],
  },
  {
    slug: "best-day-to-dca",
    title: "Best Day To DCA",
    category: "Returns",
    description: "The best day of the week to DCA, based on average extension from a moving average.",
    explanation: [
      "Each bar is the average extension of price above its 50-day SMA for that weekday, across the full history. The weekday with the lowest average extension has, historically, offered slightly cheaper buys relative to trend.",
      "Honest framing: the differences are tiny — fractions of a percent against daily volatility measured in whole percents. If a weekday edge exists (weekend closes have historically been marginally softer), it's a tie-breaker for an existing DCA habit, not a strategy.",
    ],
  },
  {
    slug: "supertrend",
    title: "Supertrend",
    category: "Momentum",
    description: "The Supertrend indicator is used to identify the current trend direction.",
    explanation: [
      "Supertrend places a trailing stop line a multiple of Average True Range (here 3× the 10-day ATR) below price in uptrends and above it in downtrends, flipping sides when price crosses it. Green segments mark uptrend support; red segments mark downtrend resistance.",
      "Because ATR widens with volatility, the stop gives more room in wild markets and tightens in calm ones. It shines as a trend-following exit discipline; it chops badly in sideways markets, like every trend indicator. Series starts in 2017, when true daily high/low data begins.",
    ],
  },
  {
    slug: "mayer",
    title: "Mayer Multiple",
    category: "Valuation",
    description: "Price divided by the 200-day SMA. Historically hot above 2.4, cheap below 0.8.",
    explanation: [
      "The Mayer Multiple, named after Trace Mayer, is simply the current price divided by its 200-day simple moving average. At 1.0, price sits exactly on its long-term trend; at 2.0 it is double the trend; below 1.0 it trades under it.",
      "The classic thresholds come from backtests over Bitcoin's history: buying when the multiple exceeded 2.4 has historically produced poor forward returns (price far above trend, late in a rally), while readings below 0.8 marked the deep-value zones of bear markets. The multiple mean-reverts: extended periods above 2 have always been followed by a return to the 200-day average.",
      "Its weakness is the same as any moving-average metric: after a violent crash the 200-day SMA itself falls, so the multiple can look \"normal\" while the market is still damaged. Read it together with the risk metric, which uses a much slower baseline.",
    ],
  },
  {
    slug: "rsi",
    title: "RSI (14d)",
    category: "Momentum",
    description: "Wilder's Relative Strength Index on daily closes. Overbought above 70, oversold below 30.",
    explanation: [
      "The Relative Strength Index (J. Welles Wilder, 1978) measures the speed of recent price changes: it compares the average size of up-days against down-days over the last 14 days and maps the result to a 0–100 scale. Persistent buying pushes it toward 100, persistent selling toward 0.",
      "The standard reading: above 70 is \"overbought\" (the rally is stretched and prone to a pause), below 30 is \"oversold\" (selling is exhausted). In strong crypto bull markets the daily RSI can pin above 70 for weeks, so overbought is not an automatic sell — the more reliable signals are oversold readings during established uptrends, and divergences, where price makes a new high but RSI makes a lower high, hinting momentum is fading.",
      "RSI is a fast momentum gauge, best for timing within a trend. It says nothing about valuation — pair it with the slower metrics (risk, Mayer) for the bigger picture.",
    ],
  },
  {
    slug: "running-roi",
    title: "Running ROI (1y)",
    category: "Returns",
    description: "Rolling 1-year return on investment, in percent.",
    explanation: [
      "Each point answers one question: if you had bought exactly one year earlier, what would your return be today? A reading of +150% means price is 2.5× what it was a year ago; −50% means it halved.",
      "The chart makes Bitcoin's cyclicality unmissable: the 1-year ROI oscillates in huge waves, from several-hundred-percent peaks in bull manias to −70%+ troughs in bear-market capitulations. The zero line is the regime boundary — extended time below it has historically been the accumulation phase, and the steep climbs off the lows mark new cycle beginnings.",
      "Note the diminishing amplitude across cycles: early peaks reached +9,000%, recent ones in the hundreds. That decay of returns as Bitcoin's market cap grows is one of the core arguments behind the log-regression approach used elsewhere on this site.",
    ],
  },
  {
    slug: "ytd-roi",
    title: "YTD ROI",
    category: "Returns",
    description:
      "Year-to-date return for each calendar year, overlayable to compare how different years unfolded.",
    explanation: [
      "Each line tracks one calendar year's cumulative return, starting from that year's first close (0% on the year's first trading day). All years are drawn on a shared January-to-December axis, so you can overlay any set of them and compare their paths day by day.",
      "Use the year pills to toggle years on and off, or the presets to jump to a cycle view. Overlaying halving years (2012, 2016, 2020, 2024) reveals how similar their second-half accelerations were; post-halving years (2013, 2017, 2021, 2025) and bear years (2014, 2018, 2022) each have their own recognizable shapes. The presidential presets slice the same calendar by the US political cycle — and note the coincidence: election years and halving years are the same years, so the two 4-year rhythms are perfectly in phase, with pre-election years being the one phase the crypto presets don't cover.",
      "Reading tip: the absolute levels matter less than the shape. Years that spent H1 flat and exploded in Q4 look very different from years that front-loaded their gains — and where the current year sits inside that family of shapes is a quick sanity check on cycle narratives.",
    ],
  },
  {
    slug: "quarterly-returns",
    title: "Quarterly Returns",
    category: "Returns",
    description: "Close-to-close returns for each calendar quarter across the full history.",
    explanation: [
      "Each cell is one quarter's return, measured from the prior quarter's final daily close. Green closed up, red closed down, intensity scaled to the size of the move.",
      "Quarters smooth out the noise that monthly cells still carry: Q4's historical strength and Q3's weakness stand out clearly, and each year compresses into four readable numbers. Q2 2011 or Q1 2013 style outliers also make it obvious which quarters defined their entire cycle.",
    ],
  },
  {
    slug: "monthly-average-roi",
    title: "Monthly Average ROI",
    category: "Returns",
    description: "The average return of each calendar month across all years.",
    explanation: [
      "Each bar averages every January, every February, and so on across Bitcoin's full history — the long-run seasonal fingerprint of the market.",
      "Averages hide variance: a +10% average month can still lose money four years out of ten. Read this next to the Monthly Returns heatmap, which shows the spread behind each bar. Small-sample caveat applies — there are only ~15 observations per month.",
    ],
  },
  {
    slug: "historical-monthly-average-roi",
    title: "Historical Monthly ROI by Year",
    category: "Returns",
    description: "Each month's return shown separately for every year.",
    explanation: [
      "The grouped bars break the Monthly Average ROI apart: within each month, one bar per year. This shows the distribution behind the seasonal average — how often October actually delivered, and how wild the spread is.",
      "Hover any bar for its exact year and value. The dominance of a few enormous early-cycle months (2011–2013) is a useful reminder of why averages alone mislead.",
    ],
  },
  {
    slug: "average-daily-returns",
    title: "Average Daily Returns",
    category: "Returns",
    description: "Average return on investment for any given day of the month.",
    explanation: [
      "Each bar is the average daily % change for that day of the month across all years — day 1 averages every 1st of the month in history, and so on.",
      "This is the chart behind \"best day to DCA\" folklore. The honest reading: differences between days are small relative to daily volatility, so treat any pattern here as weak evidence — which is itself useful to know before over-optimizing a DCA schedule.",
    ],
  },
  {
    slug: "price-drawdown-ath",
    title: "Price Drawdown From ATH",
    category: "Returns",
    description: "Percentage drawdown from the most recent all-time high.",
    explanation: [
      "The line shows how far price sits below the highest close ever reached up to that point. Zero means a new all-time high; the deep troughs are the bear-market capitulations (−93% in 2011, −84% in 2015, −83% in 2018, −77% in 2022).",
      "Two uses: gauging where the current decline ranks against history, and internalizing Bitcoin's true risk profile — every cycle so far has spent years more than 50% below its high. Note the progressively shallower cycle lows, consistent with a maturing (lower-volatility) asset.",
    ],
  },
  {
    slug: "volatility",
    title: "Volatility",
    category: "Momentum",
    description: "The 30/60/180 day volatility, equal to the standard deviation of logarithmic returns.",
    explanation: [
      "Each line is the standard deviation of daily log returns over a rolling window, in percent per day. The 30-day line reacts fast; the 180-day line shows the regime.",
      "Volatility clusters: calm periods and violent periods each persist. Historically, multi-month volatility compression (all three lines low and converging) has preceded large directional moves — the coiled-spring pattern — while volatility peaks coincide with capitulations and blow-off tops. The long-term trend is also visibly downward as the asset matures.",
    ],
  },
  {
    slug: "golden-death-crosses",
    title: "Golden/Death Crosses",
    category: "Momentum",
    description: "Golden crosses (50d SMA over 200d) and death crosses (under) marked on price.",
    explanation: [
      "A golden cross is the 50-day SMA crossing above the 200-day SMA; a death cross is the reverse. Markers show each event on the price history with both averages plotted.",
      "The classical reading — golden bullish, death bearish — is right about half the time in crypto, because the signal lags: crosses confirm a trend that is already months old, and choppy markets produce whipsaws (a cross followed quickly by its opposite). The interesting historical pattern is that death crosses have often landed near local bottoms rather than before further decline.",
    ],
  },
  {
    slug: "moving-average-convergence-divergence",
    title: "MACD",
    category: "Momentum",
    description: "The MACD indicator measures changes in strength, direction and momentum.",
    explanation: [
      "MACD is the gap between the 12- and 26-day EMAs (the orange line), with a 9-day EMA of that gap as the signal line, and the histogram showing their difference. Positive and rising = accelerating upward momentum.",
      "The standard signals: MACD crossing its signal line (short-term momentum shifts) and zero-line crossings (trend direction changes). On an asset this volatile the daily MACD fires often — the higher-value readings are divergences at extremes, where price makes a new high or low that the MACD refuses to confirm.",
    ],
  },
  {
    slug: "bollinger-bands",
    title: "Bollinger Bands",
    category: "Momentum",
    description: "Bollinger Bands create signals when an asset is either oversold or overbought.",
    explanation: [
      "The bands sit two standard deviations above and below a 20-day moving average, so they widen when volatility rises and squeeze when it falls. Roughly 95% of closes fall inside them by construction.",
      "Two classic reads: the squeeze (unusually narrow bands mark volatility compression that tends to resolve violently) and band walks (in strong trends price rides the upper or lower band for weeks — touching a band is not by itself a reversal signal).",
    ],
  },
  {
    slug: "pi-cycle-bottom-top",
    title: "Pi Cycle Bottom/Top",
    category: "Momentum",
    description: "Local price bottom/top indicator using the crossover of the 111D SMA and the 2×350D SMA.",
    explanation: [
      "When the fast 111-day SMA crosses above twice the 350-day SMA, the Pi Cycle Top has historically flagged cycle peaks with eerie precision — within days of the 2013, 2017 and 2021 tops. The name comes from 350/111 ≈ π.",
      "It is a curve-fit discovery, not a theory — there is no economic reason the ratio should be π — so treat each new cycle as an out-of-sample test. It fires rarely (a handful of events in 15 years), which is exactly what makes it worth marking on the chart.",
    ],
  },
  {
    slug: "heatmap",
    title: "Crypto Heatmap",
    category: "Market Cap",
    description: "Relative market-cap sizes with the day's biggest gainers and losers.",
    explanation: [
      "Each tile's area scales with the square root of the asset's market cap; color shows the 24-hour move. One glance answers two questions: what dominates the market, and what's moving today.",
      "Uniformly red or green boards mean macro is driving everything at once; a mixed board means idiosyncratic, rotational trading — the healthier regime for alt selection.",
    ],
  },
  {
    slug: "market-capitalization-hypotheticals",
    title: "Market Cap Hypotheticals",
    category: "Market Cap",
    description: "What each asset's price would be at another asset's market cap.",
    explanation: [
      "The classic \"if X had Y's market cap\" table: each cell scales an asset's price by the ratio of the target's market cap to its own. The small multiplier shows how many × away that scenario is.",
      "Its real use is as a plausibility filter: seeing that a favorite small cap needs 100× to reach ETH's cap converts vague dreams into arithmetic. Market cap — not price per coin — is what growth actually has to buy.",
    ],
  },
  {
    slug: "portfolios-weighted-by-market-cap",
    title: "Portfolios Weighted By Market Cap",
    category: "Market Cap",
    description: "Historical performance of top-5/10/20 market-cap-weighted portfolios vs. holding BTC.",
    explanation: [
      "Three index portfolios — the top 5, 10, and 20 tracked assets, weighted by market cap and rebalanced monthly — against simply holding Bitcoin, all indexed to 100 at the start of 2019.",
      "The uncomfortable finding this chart usually delivers: broad diversification into alts has mostly underperformed just holding BTC across full cycles, because alt drawdowns are deeper than their rallies are higher. Diversification earns its keep only in the alt-season windows — which the gap between the lines makes visible.",
    ],
  },
  {
    slug: "advance-decline-ratios",
    title: "Advance Decline Ratios",
    category: "Breadth",
    description: "The daily share of tracked assets closing up.",
    explanation: [
      "Each day, what fraction of tracked assets closed higher? Smoothed over time this is the market's participation rate — rallies where 80% of assets advance are broad and healthy; rallies where 40% advance are narrow, carried by a few names.",
      "Breadth divergences lead price: market highs made on deteriorating advance ratios (fewer and fewer assets participating) have historically preceded corrections — the crypto version of a classic equity-market signal.",
    ],
  },
  {
    slug: "advance-decline-index",
    title: "Advance Decline Index (ADI)",
    category: "Breadth",
    description: "The running sum of daily advances minus declines.",
    explanation: [
      "ADI accumulates each day's (advances − declines) into a single line — the market's cumulative participation. Rising ADI means most assets are winning most days, regardless of what the total market cap says.",
      "Watch for divergence against price: total market cap making new highs while ADI trends down means the average coin is already in decline — distribution hiding behind a strong index. Convergent new highs in both are the confirmation signal.",
    ],
  },
  {
    slug: "absolute-breadth-index",
    title: "Absolute Breadth Index (ABI)",
    category: "Breadth",
    description: "The absolute gap between advances and declines — directionless market intensity.",
    explanation: [
      "ABI is |advances − declines|: how one-sided the day was, ignoring direction. High readings mean the market moved as one block (everything up or everything down); low readings mean an even, mixed tape.",
      "Persistently high ABI marks macro-driven regimes — correlation ≈ 1 days cluster in crashes and manias. Low-ABI stretches are the stock-picker phases where individual assets trade on their own stories.",
    ],
  },
  {
    slug: "above-below-ma",
    title: "Coins Above/Below Moving Average",
    category: "Breadth",
    description: "The percentage of tracked assets trading above their 20-week SMA.",
    explanation: [
      "The bull-market participation gauge: what share of assets sit above their own 20-week average — the same line the Bull Market Support Band is built on. Above ~80%: broad bull. Below ~20%: broad bear, and historically the washout zone where bottoms form.",
      "This series turns before price at both extremes: bottoms show breadth improving while price still falls (fewer new lows), and tops show breadth decaying while price grinds higher on narrowing leadership.",
    ],
  },
  {
    slug: "color-coded-moving-average-strength",
    title: "Color-Coded MA Strength",
    category: "Breadth",
    description: "Each asset's moving-average stack: green where the faster average is above the slower.",
    explanation: [
      "Four checks per asset — price above the 20-day, 20 above 50, 50 above 100, 100 above 200 — colored green when true. A full green row is a perfectly bullish MA stack; full red, a perfect downtrend.",
      "The table reads as the market's trend X-ray: transitions matter more than states, and rows flipping from red to mixed to green in sequence trace new uptrends forming asset by asset.",
    ],
  },
  {
    slug: "does-it-bleed",
    title: "Does It Bleed",
    category: "Breadth",
    description: "Altcoin prices measured in BTC, indexed — does your coin bleed against Bitcoin?",
    explanation: [
      "Every line is an alt's BTC-denominated price, indexed to 1.0 two years ago. Below 1.0: you'd hold more value in Bitcoin — the alt \"bleeds.\" The USD chart flatters alts in bull markets; the BTC pair is the honest benchmark.",
      "The sobering base rate: over multi-year windows, most alts bleed most of the time, with brief violent exceptions during alt seasons. This chart is the antidote to survivorship memory — and the toggles let you check any specific coin's verdict.",
    ],
  },
  {
    slug: "correlation-coefficients",
    title: "Correlation Coefficients",
    category: "Breadth",
    description: "90-day return correlations between the top assets and the dollar index.",
    explanation: [
      "Pearson correlation of daily returns over the trailing 90 days, for the top tracked assets plus DXY. Red cells move together; blue cells move opposite. The BTC row is the one to read: how tightly is everything chained to Bitcoin right now?",
      "Crypto's dirty secret is visible here — intra-crypto correlations usually sit at 0.6–0.9, so diversification across coins diversifies little. The DXY column shows the macro chain: strongly negative in Fed-driven regimes, near zero when crypto trades on its own news.",
    ],
  },
  {
    slug: "roi-after-bottom-comparison",
    title: "ROI After Bottom (Multiple Coins)",
    category: "Cycles",
    description: "Each asset's multiple from the November 2022 cycle bottom.",
    explanation: [
      "Every line starts at 1× on 2022-11-21 — the cycle low — and tracks that asset's multiple since, on a log axis. Toggle assets to compare recoveries.",
      "Dispersion is the story: the same bottom produced wildly different recoveries, and the ranking reshuffles between market phases. BTC leading the early recovery with alts catching up later (or never) is the classic post-bottom sequence.",
    ],
  },
  {
    slug: "roi-after-cycle-bottom-for-crypto-pairs",
    title: "ROI After Bottom (Crypto Pairs)",
    category: "Cycles",
    description: "Each asset's performance against BTC since the November 2022 bottom.",
    explanation: [
      "Same anchor as the multiple-coins chart, but every line is the asset's BTC pair — above 1× means it beat Bitcoin since the bottom, below means it lagged. This strips out the market's beta and leaves pure relative strength.",
      "Far fewer lines hold above 1× here than on the USD version — the recurring lesson of pair charts. The ones that do are the cycle's genuine outperformers rather than passengers.",
    ],
  },
  {
    slug: "roi-after-inception-comparison",
    title: "ROI After Inception (Multiple Coins)",
    category: "Cycles",
    description: "Each asset's multiple since its own first trading day, on a shared days axis.",
    explanation: [
      "All assets aligned at day 0 = their Binance listing, tracking the multiple since. This normalizes for age: a 2017 coin and a 2023 coin can be compared at the same point in their lifecycle.",
      "Two patterns recur: early listings during bull markets start with a crash (listing pops fade), and the long-run distribution is brutally skewed — a few compounders, many round-trips to zero-ish. Day-matched comparison shows whether a young coin is tracking a compounder's path or a bleeder's.",
    ],
  },
  {
    slug: "roi-after-inception-for-crypto-pairs",
    title: "ROI After Inception (Crypto Pairs)",
    category: "Cycles",
    description: "Each asset against BTC since its own listing day.",
    explanation: [
      "The inception chart in BTC terms: from each asset's first day, did holding it beat just holding Bitcoin? Lines below 1× — the majority, most of the time — answer no.",
      "This is the cleanest long-horizon version of the \"does it bleed\" question, aligned by asset age instead of calendar. The handful of lines that sustain above 1× for years are the short list of alts that have genuinely compounded against BTC.",
    ],
  },
  {
    slug: "roi-after-sub-cycle-bottom",
    title: "ROI After Sub-Cycle Bottom (ETH)",
    category: "Cycles",
    description: "Ethereum's recovery multiple from each of its major lows.",
    explanation: [
      "Ethereum's cycle lows don't always coincide with Bitcoin's — the 2020 COVID crash and the mid-2022 capitulation were ETH-specific extremes. Each line tracks ETH's multiple from one of those lows, plus its latest 400-day low, on a shared days axis.",
      "Comparing the current recovery against 2018/2020/2022 paths answers whether ETH is tracking its own historical rhythm or breaking it — relevant right now, with ETH's latest drawdown deeper than BTC's.",
    ],
  },
  {
    slug: "mvrv",
    title: "MVRV",
    category: "On-Chain",
    description: "Market cap divided by realized cap — price relative to the market's aggregate cost basis.",
    explanation: [
      "Realized cap values every coin at the price it last moved on-chain, making it the market's aggregate cost basis. MVRV is market cap divided by that: above 1, the average holder is in profit; below 1, underwater. It's the on-chain cousin of the risk metric — valuation measured from actual coin movements instead of price trend.",
      "Historically, MVRV above ~3.5 marked euphoric tops (2013, 2017, 2021) and dips below 1 marked capitulation bottoms where the average market participant held at a loss. Today's reading near 1.2 sits in the low accumulation band. Realized cap here is derived as market cap ÷ Coin Metrics' MVRV series, since the raw series is paywalled — same number, different arithmetic.",
    ],
  },
  {
    slug: "mvrv-z-score",
    title: "MVRV Z-Score",
    category: "On-Chain",
    description: "Market cap minus realized cap, in standard deviations of their historical gap.",
    explanation: [
      "The Z-score version of MVRV: instead of a ratio, it measures how many standard deviations the gap between market cap and realized cap sits from its historical average. This normalization makes extremes comparable across cycles despite Bitcoin's growth.",
      "Readings above ~7 flagged every cycle top within weeks; readings near or below 0 marked the deep-value zones of 2011, 2015, 2018 and 2022. It's slower and steadier than price-based oscillators because realized cap only moves when coins actually change hands.",
    ],
  },
  {
    slug: "nupl",
    title: "NUPL",
    category: "On-Chain",
    description: "Net unrealized profit/loss: the share of market cap that is unrealized gain.",
    explanation: [
      "NUPL is (market cap − realized cap) ÷ market cap: the fraction of Bitcoin's value that exists as paper profit. At 0.75, three quarters of the market cap is unrealized gain (historic euphoria); below 0, the market in aggregate holds at a loss (historic capitulation).",
      "The classic band labels — belief above 0.5, optimism 0.25–0.5, hope/fear around 0–0.25, capitulation below 0 — map cleanly onto past cycles. NUPL is algebraically 1 − 1/MVRV, so the two charts always agree; NUPL just reads more intuitively as \"percent of the market that is profit.\"",
    ],
  },
  {
    slug: "puell-multiple",
    title: "Puell Multiple",
    category: "On-Chain",
    description: "Daily issuance value divided by its 365-day moving average.",
    explanation: [
      "The Puell Multiple measures miner revenue stress: the USD value of newly issued coins today versus its one-year average. High values mean mining is extraordinarily profitable (historically at cycle tops); low values mean miners earn far below trend (capitulation zones, where weak miners shut off).",
      "Sub-0.5 readings marked the 2015, 2018 and 2022 bottoms; readings above ~4 flagged tops. Halvings mechanically cut the numerator in half, which is why each halving briefly craters the multiple — the market has historically re-rated price upward over the following year, restoring it.",
    ],
  },
  {
    slug: "stock-to-flow",
    title: "Stock to Flow (S2F)",
    category: "On-Chain",
    description: "Current supply divided by annualized issuance — Bitcoin's scarcity ratio.",
    explanation: [
      "Stock-to-flow divides what exists (supply) by what's produced per year (flow). Each halving doubles the ratio in one step — the staircase in the line. Bitcoin's S2F now exceeds 100, i.e. over a century of current production to replicate the existing supply, putting it beyond gold (~60).",
      "The infamous S2F price model (scarcity → price power law) overshot badly after 2021 and is widely considered broken; we chart the ratio itself, which is just arithmetic fact, alongside price for context — scarcity rises on schedule regardless of what price does with it.",
    ],
  },
  {
    slug: "issuance",
    title: "Supply Issued & Inflation",
    category: "On-Chain",
    description: "Daily issuance in USD and the annualized supply inflation rate.",
    explanation: [
      "Two views of new supply: the dollar value of coins issued each day (what miners can sell), and the annualized inflation rate of the supply. Bitcoin's inflation is now ~0.8%/yr — below gold's and most fiat targets — and halves again every four years.",
      "The issuance line in USD is what actually pressures price: it's the daily sell-side flow the market must absorb at worst. Post-2024-halving it runs around $20–30M/day — down from over $50M equivalent at the 2021 cycle's rate.",
    ],
  },
  {
    slug: "supply-eth-btc",
    title: "Ethereum Supply Dynamics vs Bitcoin",
    category: "On-Chain",
    description: "Circulating supply of ETH and BTC over time.",
    explanation: [
      "BTC's supply follows a fixed asymptote toward 21M — the smooth flattening curve. ETH's is policy-driven: fast early inflation, slowed by successive issuance cuts, then post-Merge (Sep 2022) burn mechanics that made it roughly flat and at times deflationary.",
      "The contrast is the point: one asset's monetary policy is an algorithm frozen in 2009; the other's is an evolving social agreement. Both charts are plain supply counts — no USD anywhere.",
    ],
  },
  {
    slug: "address-activity",
    title: "Address Activity",
    category: "On-Chain",
    description: "Daily count of unique active addresses on Bitcoin and Ethereum.",
    explanation: [
      "Active addresses are the closest thing to a daily-users metric that a public ledger offers — every address that sent or received that day. It's a network-usage pulse independent of price.",
      "Divergences are the signal: usage holding firm through a price crash (2019, 2023) has marked durable bottoms, while price rallying on flat activity is the on-chain version of low-volume rallies. Caveats: one entity can control thousands of addresses, and exchange batching distorts levels — trends matter, absolutes don't.",
    ],
  },
  {
    slug: "transfer-count-statistics",
    title: "Transfer Count Statistics",
    category: "On-Chain",
    description: "Daily on-chain transactions and value-transfer counts for Bitcoin.",
    explanation: [
      "Two counts: total transactions (every on-chain operation) and transfers (those that actually moved value between distinct parties). The gap between them reflects batching, consolidation, and protocol overhead like inscriptions.",
      "Throughput on Bitcoin's base layer is capacity-bound (~300–700k tx/day), so this chart saturates rather than trends — spikes above the band usually mean fee events (2017, 2023 inscriptions), while collapses mark demand droughts.",
    ],
  },
  {
    slug: "transaction-fees",
    title: "Transaction Fees",
    category: "On-Chain",
    description: "Total daily fees paid on Bitcoin and Ethereum, in USD.",
    explanation: [
      "Fees are the purest demand signal a chain has: what users actually pay for block space. Log scale, because fee days range from thousands of dollars to the $70M+ frenzy days of 2017 and 2021.",
      "The two chains tell different stories: Bitcoin fees spike episodically (bull manias, inscription waves) on an otherwise low base; Ethereum's fee floor is structurally higher from DeFi/NFT activity but has fallen an order of magnitude since L2s absorbed volume. Fee droughts historically coincide with bear-market apathy phases.",
    ],
  },
  {
    slug: "hash-rate",
    title: "Hash Rate",
    category: "Mining",
    description: "The Bitcoin network's total mining computation rate.",
    explanation: [
      "Hash rate is the physical security budget of Bitcoin — the aggregate computation racing to produce blocks, now above 1,000 EH/s (a billion terahashes per second). Log scale: it has grown ~15 orders of magnitude since 2009.",
      "Hash rate follows price with a lag (mining investment chases profitability) but falls far more reluctantly — hardware, once bought, keeps running until it's unprofitable at the margin. Sustained hash-rate declines are rare and mark genuine miner capitulation events.",
    ],
  },
  {
    slug: "hash-ribbons",
    title: "Hash Ribbons",
    category: "Mining",
    description: "30d vs 60d moving averages of hash rate; crossovers mark miner capitulation and recovery.",
    explanation: [
      "When the 30-day average of hash rate drops below the 60-day, miners are switching off at scale — capitulation. When it crosses back above, the weakest miners are gone and the survivors are healthy — recovery. The recovery cross is the famous buy signal.",
      "The logic is Darwinian: miner capitulation clusters near price bottoms because miners are the market's most informed forced sellers; when even they stop capitulating, sell pressure exhausts. The signal fired well in 2019, 2020, and post-China-ban 2021; like all rare signals, it has few data points.",
    ],
  },
  {
    slug: "hash-over-price",
    title: "Hash Rate / Price",
    category: "Mining",
    description: "Hash rate divided by price — mining effort per dollar of Bitcoin.",
    explanation: [
      "This ratio asks how much security the network provides per dollar of price. Rising ratio means hash rate is outgrowing price (mining margins compressing); falling means price is outrunning the miners.",
      "Extremes are contrarian markers: ratio peaks (maximum mining effort per dollar) have coincided with price bottoms — hash rate held up while price collapsed — and troughs with manias where price sprinted ahead of infrastructure.",
    ],
  },
  {
    slug: "miner-revenue",
    title: "Miner Revenue",
    category: "Mining",
    description: "Total daily miner income: block subsidies plus transaction fees, in USD.",
    explanation: [
      "Everything miners earn per day. The subsidy portion halves every four years, so the long-term survival question for mining economics is whether fees grow into the gap — so far, fee share remains small outside congestion events.",
      "Miner revenue is also the market's most reliable structural sell pressure (miners pay electricity in fiat), which is why revenue extremes echo through price: the Puell Multiple and the thermocap ratios on this site are both built from this series.",
    ],
  },
  {
    slug: "mcap-thermocap",
    title: "MarketCap / ThermoCap (MCTC)",
    category: "Mining",
    description: "Market cap divided by cumulative all-time miner revenue.",
    explanation: [
      "Thermocap is every dollar ever paid to miners — the cumulative security spend, a proxy for total resources sunk into producing Bitcoin. MCTC asks: how many times over does the market value the network versus what it cost to secure it?",
      "Tops have historically stretched MCTC into the 30s+ (2013 far higher); bear bottoms compressed it toward single digits. Because thermocap only ever grows, the ratio has a natural downtrend across epochs — compare against recent cycles, not 2011.",
    ],
  },
  {
    slug: "rcap-thermocap",
    title: "RealizedCap / ThermoCap (RCTC)",
    category: "Mining",
    description: "Realized cap divided by cumulative miner revenue.",
    explanation: [
      "The steadier sibling of MCTC: realized cap (the market's cost basis) over thermocap (the security spend). Because both numerator and denominator move slowly, RCTC filters out price noise and shows the structural relationship between capital stored in Bitcoin and capital spent securing it.",
      "Rising RCTC means holders' aggregate cost basis is compounding faster than mining expenditure — long-term adoption outpacing security cost. Its cycle swings are gentle; sharp moves are rare and worth attention.",
    ],
  },
  {
    slug: "block",
    title: "Block Statistics",
    category: "Mining",
    description: "Daily block count and average block size.",
    explanation: [
      "Block count per day hovers around 144 (one per ten minutes) with drift from difficulty lag — sustained deviations reveal hash rate shocks between difficulty adjustments. Average block size shows how full blocks run.",
      "Block size tells the demand story in slow motion: the climb to the 1MB wall (2016-17), SegWit's effective-size relief, and the 2023+ inscription era pinning blocks near capacity. Full blocks plus rising fees = real block-space demand.",
    ],
  },
  {
    slug: "exchange-supply",
    title: "Supply Held By Exchanges",
    category: "Exchanges",
    description: "Coins held on exchange addresses that Coin Metrics tracks, for BTC and ETH.",
    explanation: [
      "Coins on exchanges are sellable inventory; coins withdrawn to self-custody are, statistically, being shelved. The multi-year decline in exchange balances since 2020 is one of the strongest structural bull arguments on-chain analysts cite.",
      "Caveats matter here: this counts only exchanges Coin Metrics identifies (coverage grows over time, inflating early-history comparisons), and custody arrangements (ETFs!) blur the self-custody signal. Directional trends over months are meaningful; day wiggles are not.",
    ],
  },
  {
    slug: "exchange-flow",
    title: "Supply Flow To Exchanges",
    category: "Exchanges",
    description: "Daily USD value flowing into and out of tracked exchanges, with the net.",
    explanation: [
      "Inflows are potential sell pressure arriving; outflows are coins leaving to custody. The net line below zero means more value left exchanges than arrived — the accumulation signature.",
      "Big single-day inflow spikes have preceded several violent sell-offs (they're visible before the June 2022 and FTX-era cascades), which is why exchange-flow alerts are a staple of on-chain trading desks. As with exchange supply, tracked-exchange coverage shapes the absolute numbers.",
    ],
  },
  {
    slug: "wikipedia-page-views",
    title: "Wikipedia Page Views",
    category: "Social",
    description: "Daily Wikipedia page views for Bitcoin, Ethereum, Cryptocurrency, and Blockchain.",
    explanation: [
      "Wikipedia lookups are the purest measure of fresh retail curiosity: people who need the encyclopedia article are, definitionally, newcomers. Log scale, since mania days run 100× the baseline.",
      "The peaks are cycle markers: Bitcoin's all-time attention spike was December 8, 2017 (345k views in one day); the 2021 cycle peaked lower on Bitcoin but higher on Ethereum — retail's second wave arrived alt-first. Today's readings near baseline say this drawdown is happening without public attention, historically an accumulation-phase trait.",
    ],
  },
  {
    slug: "fear-greed-index",
    title: "Fear & Greed Index",
    category: "Sentiment",
    description: "Bitcoin price color coded by the crypto Fear & Greed Index.",
    explanation: [
      "The Fear & Greed Index (published daily by alternative.me since 2018) blends volatility, momentum, social media activity, dominance, and survey data into a 0–100 sentiment score: 0 is extreme fear, 100 is extreme greed. Here it's painted onto the price line — red stretches are fearful markets, green stretches greedy ones.",
      "The contrarian reading is the useful one: extreme fear has historically clustered near local and cycle bottoms (when buying felt impossible), and extreme greed near tops. It agrees with the risk metric surprisingly often despite measuring completely different inputs — sentiment versus valuation.",
      "Grey price history before February 2018 predates the index. Sentiment is fast and noisy — treat single-day readings as weather, multi-week extremes as climate.",
    ],
  },
  {
    slug: "risk-dashboard",
    title: "Risk Dashboard",
    category: "Risk",
    description: "Current risk, momentum, and cycle position across all tracked assets.",
    explanation: [
      "Every tracked asset gets the same treatment BTC does: its own quantile-regression fan fitted to its full price history, with risk = the price's current percentile inside that fan. The table sorts by market cap and adds 24h/30d/1y returns, the Mayer Multiple, and whether price sits above its 20-week SMA (the bull-market line).",
      "This is the screen for relative positioning: which majors are stretched, which are washed out, and whether risk is broadly synchronized (macro-driven markets) or dispersed (rotation markets). Assets marked * have under two years of history — their fans are fitted to a single partial cycle, so read those risk values loosely.",
    ],
  },
  {
    slug: "dominance",
    title: "Dominance",
    category: "Market Cap",
    description: "Each asset's market cap as a share of the total tracked crypto market cap.",
    explanation: [
      "Dominance is an asset's market cap divided by the whole market's. BTC dominance is the market's risk dial: money rotates from BTC into alts as cycles heat up (dominance falls) and flees back to BTC — or out entirely — in fear (dominance rises).",
      "Our denominator is the aggregate of the ~30 tracked assets plus major stablecoins rather than every coin in existence, so levels read a few points higher than CoinMarketCap's, but the shape and turning points — which are what dominance is for — match. The classic pattern: dominance peaks near bear-market bottoms and troughs at alt-season manias.",
    ],
  },
  {
    slug: "market-cap-logarithmic-regression",
    title: "Total Crypto Market Cap & Trendline",
    category: "Market Cap",
    description: "Aggregate market cap of tracked assets with a fitted trendline and bands.",
    explanation: [
      "The total market cap of all tracked assets (log scale) with a quantile-regression trendline: the middle curve is the median fit, the outer curves the 15th/85th percentile bands. It's the market-wide version of BTC's fair-value model.",
      "Total market cap is arguably a better cycle gauge than BTC's price alone because it absorbs rotation: alt seasons that leave BTC flat still show up here. Note the aggregate is built from our tracked asset set, so early history (pre-2017) undercounts the then-fragmented market.",
    ],
  },
  {
    slug: "market-cap-vs-fair-value",
    title: "Total Crypto Valuation vs. Trendline",
    category: "Market Cap",
    description: "Extension of the total market cap above or below its fitted trendline.",
    explanation: [
      "This is the trendline chart flattened into a single oscillator: the ratio of total market cap to its median trendline fit. 1.0 means the market sits exactly on trend; 2.0 means double the trend; 0.5 means half.",
      "Cycle tops have historically pushed the ratio far above 1 and bear bottoms well below it, making this the market-wide cousin of the risk metric. Reading today's value against past extremes is the quickest \"is crypto as a whole cheap or dear?\" check on the site.",
    ],
  },
  {
    slug: "altcoin-market-capitalizations",
    title: "Altcoin Market Capitalizations",
    category: "Market Cap",
    description: "The total market minus Bitcoin — and minus Ethereum and stablecoins.",
    explanation: [
      "Two views of the market without its anchor: total minus BTC (everything that isn't Bitcoin), and total minus BTC, ETH, and stablecoins (the speculative long tail). Log scale.",
      "The second line is the purest alt-season gauge: stablecoins don't speculate and ETH half-behaves like a major, so what's left is the risk appetite frontier. Its cycles are more violent than BTC's in both directions — the same chart shape, amplified.",
    ],
  },
  {
    slug: "ssr",
    title: "Stablecoin Supply Ratio (SSR)",
    category: "Market Cap",
    description: "Bitcoin market cap divided by the aggregate stablecoin market cap.",
    explanation: [
      "SSR compares Bitcoin's market cap to the combined market cap of major stablecoins (USDT, USDC, DAI). Stablecoins are the market's dry powder — capital parked on-exchange, one click from buying.",
      "Low SSR means stablecoin buying power is large relative to Bitcoin — historically a supportive setup — while high SSR means little sideline capital remains relative to BTC's size. The metric trends structurally downward as stablecoins grow, so compare against the recent regime rather than 2018 levels.",
    ],
  },
  {
    slug: "altcoin-season-index",
    title: "Altcoin Season Index",
    category: "Returns",
    description: "The share of tracked altcoins outperforming Bitcoin over the trailing 90 days.",
    explanation: [
      "For each day, the index asks: what fraction of tracked altcoins beat Bitcoin's return over the previous 90 days? Above 75 is conventionally \"altcoin season\"; below 25 is \"Bitcoin season.\"",
      "Alt seasons are the euphoric late phase of bull markets — capital rotating down the risk curve — and they historically cluster just before cycle tops, which makes this as much a warning gauge as a celebration. Our universe is the ~27 tracked alts rather than the top-50 ITC uses, so exact values differ slightly; the regime signal is the same.",
    ],
  },
  {
    slug: "inflation-yoy",
    title: "Inflation YoY",
    category: "Macro",
    description: "US CPI and core CPI, year-over-year.",
    explanation: [
      "Headline CPI includes everything; core strips food and energy to show the underlying trend the Fed actually steers by. Both are year-over-year changes in the official index — the number that sets the policy weather for every risk asset.",
      "The 2021–2023 spike to 9% and its aftermath created the QT regime that defined crypto's last bear market. Inflation returning toward the 2% target is what allows easing — which is why this unglamorous line sits upstream of most charts on this site.",
    ],
  },
  {
    slug: "money-supply",
    title: "M1 / M2 Money Supply",
    category: "Macro",
    description: "US money supply since 1959, log scale.",
    explanation: [
      "M1 is money you can spend now (currency + checking); M2 adds savings and money-market funds. The log scale shows six decades of monetary expansion — including the unprecedented 2020 vertical, when M2 grew ~25% in a year.",
      "Bitcoin's entire pitch is legible against this backdrop: a fixed-supply asset priced in an expanding unit. The 2022–2023 stretch was the first meaningful M2 *contraction* since the 1940s — precisely the crypto bear — before growth resumed.",
    ],
  },
  {
    slug: "fed-liquidity",
    title: "Fed Balance Sheet & ON RRP",
    category: "Macro",
    description: "Fed total assets alongside the overnight reverse repo facility.",
    explanation: [
      "Two plumbing gauges: the Fed's total assets (the QE/QT dial) and the overnight reverse repo facility, where money-market funds park excess cash. RRP drained from $2.5T to near zero through 2023–24 — a drain that quietly offset QT and cushioned markets.",
      "Net-liquidity thinking (balance sheet minus RRP and the Treasury's account) is why 2023 equities rallied through QT. With RRP empty, QT bites directly — and its end, visible in the balance sheet flattening, is the regime change the QT chart tracks against BTC.",
    ],
  },
  {
    slug: "yield-curves",
    title: "Treasury Yield Spreads",
    category: "Macro",
    description: "The 10y−2y and 10y−3m Treasury spreads — the recession signal.",
    explanation: [
      "When short rates exceed long rates (spread below zero), the curve is inverted: markets expect rate cuts ahead, historically because a recession forces them. Inversion has preceded every US recession for half a century.",
      "The nuance the chart shows: recessions historically start not at inversion but at the re-steepening — when the spread races back above zero as the Fed cuts into weakness. For crypto, the steepening phase has coincided with the liquidity turns that end bear markets.",
    ],
  },
  {
    slug: "fed-funds-rate",
    title: "Fed Funds Rate",
    category: "Macro",
    description: "The federal funds effective rate since 1954.",
    explanation: [
      "The price of money itself. Every hiking and easing cycle since 1954 in one line — including the 2022 sprint from zero to 5%+, the fastest since Volcker, which repriced every asset on earth.",
      "Bitcoin has now lived through one full hiking cycle, and the correlation was unambiguous: crypto's 2021 top arrived as hikes were priced in, the bottom as they peaked. Cuts are the fuel every crypto bull thesis quietly assumes.",
    ],
  },
  {
    slug: "employment",
    title: "Unemployment & Payrolls",
    category: "Macro",
    description: "The unemployment rate and total nonfarm payrolls.",
    explanation: [
      "The Fed's second mandate. Unemployment is a stair-stepper: it falls slowly for years and spikes fast in recessions — the spikes align with every recession since 1948.",
      "For markets the rule of thumb inverts intuition: deteriorating employment historically forces easing (good for liquidity-sensitive assets, eventually), while red-hot labor markets sustain tight policy. The Sahm rule — a 0.5pt rise in unemployment off its low — is the classic recession trigger visible here.",
    ],
  },
  {
    slug: "gdp-and-debt",
    title: "GDP & Debt-to-GDP",
    category: "Macro",
    description: "Nominal US GDP and federal debt as a share of GDP.",
    explanation: [
      "Output and the leverage carried against it. Debt-to-GDP crossing 100% and staying there post-2020 is the fiscal backdrop for the \"debasement trade\" — the argument that deficits eventually force accommodative policy regardless of inflation.",
      "This is the slowest-moving chart on the site and the one underpinning the longest-horizon Bitcoin thesis: fixed-supply assets as insurance against fiscal dominance. Quarterly data; decades matter here, not months.",
    ],
  },
  {
    slug: "personal-income",
    title: "Personal Income & Saving Rate",
    category: "Macro",
    description: "Real personal income (ex transfers) and the personal saving rate.",
    explanation: [
      "Real income ex-transfers is the organic earning power of households — one of the four official recession-dating indicators. The saving rate shows what's left after spending: its 2020 spike to 30%+ (stimulus with nowhere to go) was the retail wave that flooded into markets, crypto included.",
      "A saving rate scraping historic lows alongside flat real income is the squeezed-consumer signature — historically late-cycle, and part of why discretionary risk appetite (the fuel of alt seasons) has been thin this cycle.",
    ],
  },
  {
    slug: "consumer-sentiment",
    title: "Consumer Sentiment (MCSI)",
    category: "Macro",
    description: "The University of Michigan consumer sentiment index since 1952.",
    explanation: [
      "Seven decades of how Americans feel about the economy. The 2022 print was the lowest in the survey's history — below both oil crises and 2008 — driven by inflation's unique power to sour sentiment.",
      "Sentiment is contrarian at extremes: historic lows have been better buying moments than selling ones, for equities and (in its short history) crypto alike. The interesting divergence is sentiment versus spending — people who feel terrible but keep spending have repeatedly postponed predicted recessions.",
    ],
  },
  {
    slug: "housing",
    title: "Housing Starts & New Home Sales",
    category: "Macro",
    description: "New residential construction and new single-family home sales.",
    explanation: [
      "Housing is the economy's most interest-rate-sensitive sector and its most reliable early-cycle indicator — starts roll over a year or more before recessions and trough before recoveries.",
      "The post-2022 freeze is textbook: 7% mortgages froze both construction and sales. Housing turning up while the Fed still holds tight would be the classic early-recovery divergence to watch for.",
    ],
  },
  {
    slug: "home-prices-and-mortgages",
    title: "House Prices & Mortgage Rates",
    category: "Macro",
    description: "Case-Shiller national home price index against the 30-year mortgage rate.",
    explanation: [
      "The affordability vice: prices (Case-Shiller, left) against the cost of financing them (30-year fixed, right). The 2022 anomaly — rates doubling while prices barely dipped — came from rate lock-in: nobody sells a 3% mortgage to buy a 7% one, so supply vanished alongside demand.",
      "For the macro picture, shelter is the stickiest large component of CPI, so this chart feeds the inflation chart with a ~12-month lag. Falling rates with resilient prices re-ignites the wealth effect; falling prices would be the deflationary tail risk.",
    ],
  },
  {
    slug: "bank-loans",
    title: "Bank Loans",
    category: "Macro",
    description: "Consumer, business, and real-estate loans at US commercial banks.",
    explanation: [
      "Credit creation is the economy's private money supply — most money is born as bank loans. Expanding credit is expansionary regardless of what the Fed does; contracting credit (rare — 2009, briefly 2023) is the true crunch signal.",
      "Composition matters: business lending leads investment cycles, consumer credit tracks household stress (watch it accelerate late-cycle as savings run out), and real-estate lending is the slow giant that broke in 2008.",
    ],
  },
  {
    slug: "nfci",
    title: "Financial Conditions (NFCI)",
    category: "Macro",
    description: "The Chicago Fed's National Financial Conditions Index — one number for how tight money is.",
    explanation: [
      "The NFCI compresses 105 indicators of risk, credit, and leverage into one weekly number: positive = tighter than average, negative = looser. It's the closest thing to a single dial for \"is the financial system easy or stressed?\"",
      "Spikes mark every crisis — 2008 dominating, March 2020 second. For crypto, the regime reading matters most: risk assets rally when conditions loosen (NFCI falling), and the index loosening during 2023's Fed tightening explained that year's \"impossible\" rally.",
    ],
  },
  {
    slug: "qt-ending-bear-markets",
    title: "QT Ending Bear Markets",
    category: "Macro",
    description:
      "Bitcoin against the Fed's balance sheet, with Quantitative Tightening episodes marked.",
    explanation: [
      "Quantitative Tightening (QT) is the Federal Reserve shrinking its balance sheet — draining the liquidity that QE injected. The blue line is the Fed's total assets (FRED series WALCL); the markers flag when each QT episode started and ended. Bitcoin, the most liquidity-sensitive large asset in existence, has lived and died by this line.",
      "The pattern this chart is named for: both of Bitcoin's deepest modern bears happened *during* QT — the 2018 bear during QT1 (ended August 2019) and the 2022 bear during QT2 — and the endings of QT have historically marked the transition back to easier conditions that bull markets grew out of.",
      "The current setup is why this chart matters now: the balance sheet stopped shrinking around late 2025 and has begun ticking up — QT2 is effectively over — while BTC sits deep in a drawdown. If the 2019 rhyme holds, this is the part of the cycle where liquidity stops being a headwind. A rhyme, not a law.",
    ],
  },
  {
    slug: "btc-vs-dxy",
    title: "BTC vs. DXY",
    category: "Other",
    description: "Bitcoin against the US Dollar Index — historically strongly negatively correlated.",
    explanation: [
      "The DXY measures the dollar's strength against a basket of major currencies (euro, yen, pound, and others). Bitcoin, priced in dollars and behaving like a liquidity-sensitive risk asset, has historically moved inversely to it: dollar strength coincides with BTC weakness and vice versa.",
      "The big alignments are striking: the 2021 crypto top formed as DXY bottomed, the 2022 bear market tracked DXY's violent rally to 114, and BTC's recoveries have coincided with dollar retreats. The mechanism is macro: a rising dollar usually means tightening global liquidity — the tide that floats or sinks all risk assets.",
      "BTC is on the log scale (right axis), DXY linear (left). The correlation is a regime, not a law — it weakens in quiet macro periods and tightens when the Fed dominates the narrative.",
    ],
  },
  {
    slug: "benfords-law",
    title: "Benford's Law",
    category: "Other",
    description: "The probability of an asset having a certain leading digit (1, 2, ..., 9).",
    explanation: [
      "Benford's Law says that in many naturally occurring datasets, smaller leading digits dominate: numbers starting with 1 appear ~30% of the time, with 9 under 5%. The bars compare Bitcoin's daily closing prices against that theoretical curve.",
      "Data spanning many orders of magnitude (like a price that went from $0.07 to $120k) should follow Benford closely — and Bitcoin does, which is a neat statistical fingerprint of organic, multiplicative growth. Strong deviations in other assets can hint at manipulated or range-pinned prices.",
    ],
  },
  {
    slug: "price-milestone-crossings",
    title: "Price Milestone Crossings",
    category: "Other",
    description: "How many times has BTC price crossed various price milestones?",
    explanation: [
      "Each dot marks a day when price crossed a round-number milestone ($1k, $10k, $20k, …) in either direction. Clusters of dots at one level show price churning around that milestone; a level with a single dot was crossed once and never revisited.",
      "Round numbers act as psychological support and resistance, and this chart makes the battlegrounds visible — the $10k and $20k levels were each crossed dozens of times before finally being left behind, while levels conquered in strong trends barely register a second dot.",
    ],
  },
  {
    slug: "days-since-percentage-decline",
    title: "Days Since % Decline",
    category: "Other",
    description: "The amount of days since a single-day percentage decline occurred.",
    explanation: [
      "The counter rises by one each day and resets to zero whenever a daily drop of at least the chosen size (5%, 10%, 20%) occurs, with price shown behind it for context.",
      "Long stretches without a big red day are a feature of maturing bull markets — and the counter's height going into a top measures how complacent the market had become. The declining frequency of 10%+ days across the years is also one of the cleanest views of Bitcoin's falling volatility.",
    ],
  },
  {
    slug: "days-since-percentage-gain",
    title: "Days Since % Gain",
    category: "Other",
    description: "The amount of days since a certain single-day percentage gain has occurred.",
    explanation: [
      "The mirror image of Days Since % Decline: the counter resets whenever a single-day gain of at least the chosen size occurs.",
      "Big green days cluster in two regimes: euphoric bull runs and violent bear-market rallies. A very tall counter means the market has gone a long time without explosive upside — historically common in late bears and early accumulation phases, when volatility is compressed.",
    ],
  },
  {
    slug: "monthly-returns",
    title: "Monthly Returns",
    category: "Returns",
    description: "Month-by-month close-to-close returns across the full history.",
    explanation: [
      "Each cell is one month's return, measured close-to-close from the prior month's final daily close. Green months closed up, red months closed down, and the color intensity scales with the size of the move (saturating at ±30%).",
      "Scanning columns reveals Bitcoin's seasonal folklore and how real it is: October (\"Uptober\") and November have historically skewed green, September has skewed red, and the strongest months cluster in Q4. Scanning rows shows each year's character at a glance — the relentless green of 2013 and 2017, the almost unbroken red of 2018 and 2022.",
      "Seasonality in crypto is a weak effect layered on top of the cycle: a September in a raging bull market is still more likely green than an October in a deep bear. Use this as context, not as a signal on its own.",
    ],
  },
];

export const CATEGORIES = [...new Set(CHARTS.map((c) => c.category))];

export function chartBySlug(slug: string): ChartDef | undefined {
  return CHARTS.find((c) => c.slug === slug);
}
