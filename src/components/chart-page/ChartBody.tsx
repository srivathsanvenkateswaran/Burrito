import ChartRenderer from "./ChartRenderer";
import type { ChartPageAsset } from "./types";

/**
 * The chart itself. The series live in a static JSON file rather than in this
 * page's HTML; `ChartRenderer` fetches it in the browser.
 */
export default function ChartBody({ slug, asset }: { slug: string; asset: ChartPageAsset }) {
  return <ChartRenderer src={`/chart-data/${asset.id}/${slug}.json`} />;
}
