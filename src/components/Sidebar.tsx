"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, CHARTS, chartBySlug } from "@/lib/charts";
import { chartText } from "@/lib/chartText";
import { assetChartSlugs, getAsset, PAGE_ASSETS, toChartAsset } from "@/lib/assets";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-raise text-fg"
          : "text-muted hover:bg-surface hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Sidebar({
  variant = "desktop",
  suiteIds,
}: {
  variant?: "desktop" | "drawer";
  suiteIds: string[];
}) {
  const pathname = usePathname();

  const assetMatch = pathname.match(/^\/assets\/([^/]+)/);
  const assetId = assetMatch ? assetMatch[1] : null;
  const def = assetId ? getAsset(assetId) : null;
  const slugs = def ? assetChartSlugs(def.id, suiteIds.includes(def.id)) : [];

  return (
    <aside
      className={
        variant === "desktop"
          ? "app-chrome sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line px-3 py-5 md:flex"
          : "app-chrome flex h-full w-64 flex-col overflow-y-auto bg-ink px-3 py-5"
      }
    >
      <Link href="/" className="mb-7 block px-3">
        <span className="font-display text-2xl font-extrabold tracking-tight text-fg">
          Burrito<span className="text-accent">.</span>
        </span>
        <span className="mt-0.5 block text-xs text-faint">
          every market, one tortilla
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        <NavLink href="/dashboard" active={pathname === "/dashboard"}>
          Dashboard
        </NavLink>
        <NavLink href="/assets" active={pathname === "/assets"}>
          Assets
        </NavLink>
        <NavLink href="/docs" active={pathname.startsWith("/docs")}>
          Docs
        </NavLink>

        {def ? (
          <>
            <div className="mt-4 rounded-lg border border-line bg-surface/50 px-3 py-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                {def.class} · {def.sector}
              </div>
              <div className="mt-0.5 text-sm font-medium text-fg">{def.symbol}</div>
              <div className="text-xs text-faint">{def.name}</div>
            </div>
            <Link
              href="/assets"
              className="mb-1 mt-2 block px-3 py-1 text-xs text-muted transition-colors hover:text-fg"
            >
              ← All assets
            </Link>

            {CATEGORIES.map((cat) => {
              const catSlugs = slugs.filter((slug) => chartBySlug(slug)?.category === cat);
              if (catSlugs.length === 0) return null;
              return (
                <div key={cat} className="mt-4">
                  <div className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                    {cat}
                  </div>
                  {catSlugs.map((slug) => {
                    const chartDef = chartBySlug(slug)!;
                    const title = chartText(chartDef, toChartAsset(def)).title;
                    const href = `/assets/${def.id}/${slug}`;
                    return (
                      <NavLink key={slug} href={href} active={pathname === href}>
                        {title}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </>
        ) : (
          CATEGORIES.map((cat) => (
            <div key={cat} className="mt-4">
              <div className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                {cat}
              </div>
              {CHARTS.filter((c) => c.category === cat).map((c) => (
                <NavLink
                  key={c.slug}
                  href={`/charts/${c.slug}`}
                  active={pathname === `/charts/${c.slug}`}
                >
                  {c.title}
                </NavLink>
              ))}
            </div>
          ))
        )}
      </nav>

      <div className="mt-auto px-3 pt-6 text-[11px] leading-relaxed text-faint">
        {PAGE_ASSETS.length} assets · {CHARTS.length} charts
        <br />
        not financial advice, just a burrito
      </div>
    </aside>
  );
}
