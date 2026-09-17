/**
 * Cycle detection and price-milestone generation for any asset class.
 * Pure functions over (date, close) rows; no I/O.
 */
import { daysBetween } from "./metrics";

export interface Cycles {
  peaks: string[];
  bottoms: string[];
}

/** Drawdown from ATH that qualifies as a cycle top, per asset class. */
export const CYCLE_THRESHOLDS: Record<string, number> = {
  crypto: 0.6,
  stablecoin: 0.6,
  equity: 0.35,
  index: 0.19,
};

/**
 * Peaks and bottoms from the close series alone. A peak is the all-time-high
 * close preceding a drawdown of at least `minDrawdown` (0.6 = −60%); its
 * bottom is the lowest close between that peak and the recovery to a new ATH
 * (or the end of the series). A trough that sits inside the final
 * `unconfirmedDays` calendar days of the series is not yet a bottom.
 */
export function detectCycles(
  rows: { date: string; close: number }[],
  minDrawdown: number,
  unconfirmedDays = 90,
): Cycles {
  const peaks: string[] = [];
  const bottoms: string[] = [];
  if (rows.length === 0) return { peaks, bottoms };
  let athIdx = 0;
  let inDrawdown = false;
  let minIdx = 0;
  for (let i = 1; i < rows.length; i++) {
    const c = rows[i].close;
    if (c > rows[athIdx].close) {
      if (inDrawdown) {
        bottoms.push(rows[minIdx].date);
        inDrawdown = false;
      }
      athIdx = i;
      continue;
    }
    if (!inDrawdown) {
      if (1 - c / rows[athIdx].close >= minDrawdown) {
        inDrawdown = true;
        peaks.push(rows[athIdx].date);
        minIdx = i;
      }
    } else if (c < rows[minIdx].close) {
      minIdx = i;
    }
  }
  if (inDrawdown) {
    const last = rows[rows.length - 1].date;
    if (daysBetween(rows[minIdx].date, last) >= unconfirmedDays) bottoms.push(rows[minIdx].date);
  }
  return { peaks, bottoms };
}

/**
 * Round price levels ({1, 2, 5} × 10^k) strictly inside [min, max] of the
 * closes. Thinned to {1, 5} × 10^k, then {1} × 10^k, if more than `cap`.
 */
export function milestoneLevels(closes: number[], cap = 24): number[] {
  const positive = closes.filter((c) => c > 0);
  if (positive.length === 0) return [];
  const min = Math.min(...positive);
  const max = Math.max(...positive);
  const kMin = Math.floor(Math.log10(min));
  const kMax = Math.ceil(Math.log10(max));
  const build = (mantissas: number[]): number[] => {
    const out: number[] = [];
    for (let k = kMin; k <= kMax; k++) {
      for (const m of mantissas) {
        const level = Number((m * 10 ** k).toPrecision(12));
        if (level > min && level < max) out.push(level);
      }
    }
    return out;
  };
  for (const mantissas of [[1, 2, 5], [1, 5], [1]]) {
    const levels = build(mantissas);
    if (levels.length <= cap) return levels;
  }
  return build([1]).filter((_, i, all) => i % Math.ceil(all.length / cap) === 0);
}
