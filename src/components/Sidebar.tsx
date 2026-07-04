"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, CHARTS } from "@/lib/charts";

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

export default function Sidebar({ variant = "desktop" }: { variant?: "desktop" | "drawer" }) {
  const pathname = usePathname();

  return (
    <aside
      className={
        variant === "desktop"
          ? "sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line px-3 py-5 md:flex"
          : "flex h-full w-64 flex-col overflow-y-auto bg-ink px-3 py-5"
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
        <NavLink href="/docs" active={pathname.startsWith("/docs")}>
          Docs
        </NavLink>

        {CATEGORIES.map((cat) => (
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
        ))}
      </nav>

      <div className="mt-auto px-3 pt-6 text-[11px] leading-relaxed text-faint">
        BTC · more assets soon
        <br />
        not financial advice, just a burrito
      </div>
    </aside>
  );
}
