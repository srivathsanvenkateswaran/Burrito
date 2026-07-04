import Link from "next/link";
import { notFound } from "next/navigation";
import { listDocs, renderDoc } from "@/lib/docs";

export function generateStaticParams() {
  return [
    { slug: [] as string[] },
    ...listDocs()
      .filter((d) => d.slug !== "index")
      .map((d) => ({ slug: d.slug.split("/") })),
  ];
}

const NAV_ORDER = ["index", "risk-metric", "data-pipeline", "charts/index", "snapshot", "faq"];

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug: parts } = await params;
  const slug = (parts ?? []).join("/");
  const doc = renderDoc(slug);
  if (!doc) notFound();

  const docs = listDocs();
  const nav = [
    ...NAV_ORDER.flatMap((s) => docs.filter((d) => d.slug === s)),
    ...docs.filter((d) => d.slug.startsWith("charts/") && d.slug !== "charts/index"),
  ];

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="flex gap-10">
        <nav className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
              Docs
            </div>
            {nav.map((d) => (
              <Link
                key={d.slug}
                href={`/docs/${d.slug === "index" ? "" : d.slug.replace(/\/index$/, "")}`}
                className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  d.slug === (slug || "index")
                    ? "bg-raise text-fg"
                    : "text-muted hover:text-fg"
                } ${d.slug.startsWith("charts/") && d.slug !== "charts/index" ? "pl-6 text-xs" : ""}`}
              >
                {d.title.replace(" Charts", "")}
              </Link>
            ))}
          </div>
        </nav>
        <article
          className="docs-prose min-w-0 max-w-3xl flex-1"
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </div>
    </main>
  );
}
