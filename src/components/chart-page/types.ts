import type { ChartAsset } from "@/lib/chartText";

/** The asset shape ChartBody/ChartPage need — a superset of the text-interpolation ChartAsset. */
export interface ChartPageAsset extends ChartAsset {
  /** Registry id of the relative-strength benchmark, when one is configured. */
  benchmark?: string;
  periodsPerYear: number;
  quote: string;
}
