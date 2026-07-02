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
          ? "bg-neutral-800 text-neutral-100"
          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-neutral-900 px-3 py-5">
      <Link href="/" className="mb-6 block px-3">
        <span className="text-lg font-bold tracking-tight">🌯 burrito</span>
        <span className="mt-0.5 block text-xs text-neutral-500">
          every market, one tortilla
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        <NavLink href="/" active={pathname === "/"}>
          Dashboard
        </NavLink>

        {CATEGORIES.map((cat) => (
          <div key={cat} className="mt-4">
            <div className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
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

      <div className="mt-auto px-3 pt-6 text-[11px] leading-relaxed text-neutral-600">
        BTC · more assets soon
        <br />
        not financial advice, just a burrito
      </div>
    </aside>
  );
}
