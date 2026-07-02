/** salsa → queso → chile across 0..1 (shared by server and client code) */
export function riskColor(v: number): string {
  const stops: [number, number[]][] = [
    [0, [130, 181, 122]],
    [0.5, [230, 161, 68]],
    [1, [222, 107, 90]],
  ];
  const upper = stops.findIndex(([s]) => v <= s);
  if (upper <= 0) return `rgb(${stops[upper === 0 ? 0 : stops.length - 1][1].join(",")})`;
  const [s0, c0] = stops[upper - 1];
  const [s1, c1] = stops[upper];
  const t = (v - s0) / (s1 - s0);
  const mix = c0.map((c, i) => Math.round(c + (c1[i] - c) * t));
  return `rgb(${mix.join(",")})`;
}
