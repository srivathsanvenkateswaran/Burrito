/** Shared price/percent/market-cap formatting — pure, no Node built-ins, safe on client or server. */

export function fmtPrice(v: number, quote: string = "USD"): string {
  const prefix = quote === "KRW" ? "₩" : "$";
  if (v >= 1000) return `${prefix}${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `${prefix}${v.toFixed(2)}`;
  return `${prefix}${v.toPrecision(3)}`;
}

export function fmtPct(v: number | null): string {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export function fmtMcap(v: number | null): string {
  if (v === null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}
