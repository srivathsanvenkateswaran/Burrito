"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MobileSidebar from "./MobileSidebar";
import SearchPalette from "./SearchPalette";
import ThemeToggle from "./ThemeToggle";
import { assetChartSlugs, groupAssets, type AssetClass } from "@/lib/assets";
import { riskColor } from "@/lib/colors";
import { fmtPct, fmtPrice } from "@/lib/format";

export interface HeaderAsset {
  id: string;
  symbol: string;
  name: string;
  class: AssetClass;
  sector: string;
  close: number | null;
  chg24h: number | null;
  risk: number | null;
  quote: string;
  /** Whether this asset's fitted chart suite has been computed (see computedSuiteIds). */
  hasSuite: boolean;
}

interface Props {
  assets: HeaderAsset[];
  date: string;
}

function currentAssetId(pathname: string): string {
  const m = pathname.match(/^\/assets\/([^/]+)/);
  return m ? m[1] : "btc";
}

/** The chart slug the current page renders, if any — from either URL shape. */
function currentSlug(pathname: string): string | null {
  let m = pathname.match(/^\/assets\/[^/]+\/([^/]+)/);
  if (m) return m[1];
  m = pathname.match(/^\/charts\/([^/]+)/);
  return m ? m[1] : null;
}

export default function Header({ assets, date }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const activeId = currentAssetId(pathname);
  const active = assets.find((a) => a.id === activeId) ?? assets[0];
  const suiteIds = useMemo(() => assets.filter((a) => a.hasSuite).map((a) => a.id), [assets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.sector.toLowerCase().includes(q),
    );
  }, [assets, query]);

  // exact symbol match ranks first
  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return [...filtered].sort((a, b) => {
      const ae = a.symbol.toLowerCase() === q ? 0 : 1;
      const be = b.symbol.toLowerCase() === q ? 0 : 1;
      return ae - be;
    });
  }, [filtered, query]);

  const groups = useMemo(() => groupAssets(ranked), [ranked]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const goTo = useCallback(
    (targetId: string) => {
      const slug = currentSlug(pathname);
      const supports = slug !== null && assetChartSlugs(targetId, suiteIds.includes(targetId)).includes(slug);
      const href = supports
        ? targetId === "btc"
          ? `/charts/${slug}`
          : `/assets/${targetId}/${slug}`
        : targetId === "btc"
          ? "/dashboard"
          : `/assets/${targetId}`;
      close();
      router.push(href);
    },
    [pathname, router, close, suiteIds],
  );

  if (!active) {
    // no asset list resolved (shouldn't happen) — render the chrome without a switcher
    return (
      <header className="app-chrome sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur sm:gap-4 sm:px-6">
        <MobileSidebar suiteIds={suiteIds} />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-faint md:inline">{date}</span>
        <div className="ml-auto flex items-center gap-2">
          <SearchPalette suiteIds={suiteIds} />
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="app-chrome sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-line bg-ink/85 px-4 backdrop-blur sm:gap-4 sm:px-6">
      <MobileSidebar suiteIds={suiteIds} />

      <div ref={rootRef} className="relative">
        <button
          onClick={() => {
            setOpen((o) => !o);
            setSelected(0);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-raise"
        >
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-faint sm:inline">
            {active.symbol} / {active.quote}
          </span>
          <span className="font-mono text-sm text-fg">
            {active.close === null ? "—" : fmtPrice(active.close, active.quote)}
          </span>
          {active.chg24h !== null && (
            <span className={`font-mono text-xs ${active.chg24h >= 0 ? "text-gain" : "text-loss"}`}>
              {fmtPct(active.chg24h)}
            </span>
          )}
          {active.risk !== null && (
            <span className="hidden items-center gap-1.5 font-mono text-xs text-muted sm:flex">
              <span className="text-faint">·</span>
              <span style={{ color: riskColor(active.risk) }}>risk {active.risk.toFixed(2)}</span>
            </span>
          )}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="shrink-0 text-faint"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-2 w-[min(20rem,85vw)] rounded-xl border border-line bg-surface shadow-2xl">
            <div className="border-b border-line/70 px-3 py-2">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelected((s) => Math.min(s + 1, ranked.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelected((s) => Math.max(s - 1, 0));
                  } else if (e.key === "Enter" && ranked[selected]) {
                    goTo(ranked[selected].id);
                  } else if (e.key === "Escape") {
                    close();
                  }
                }}
                placeholder="Filter assets…"
                className="w-full bg-transparent py-1 text-sm text-fg outline-none placeholder:text-faint"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-1.5">
              {ranked.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-faint">No assets match</div>
              ) : (
                groups.map((g) => (
                  <div key={g.sector} className="mb-1">
                    <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                      {g.sector}
                    </div>
                    {g.items.map((a) => {
                      const idx = ranked.indexOf(a);
                      return (
                        <button
                          key={a.id}
                          onMouseEnter={() => setSelected(idx)}
                          onClick={() => goTo(a.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                            idx === selected ? "bg-raise" : ""
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm text-fg">{a.symbol}</span>
                            <span className="block truncate text-xs text-faint">{a.name}</span>
                          </span>
                          {a.close !== null && (
                            <span className="shrink-0 font-mono text-xs text-muted">
                              {fmtPrice(a.close, a.quote)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-faint md:inline">{date}</span>
      <div className="ml-auto flex items-center gap-2">
        <SearchPalette suiteIds={suiteIds} />
        <Link
          href="/"
          className="hidden rounded-md border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-faint/60 hover:text-fg sm:inline"
        >
          Home
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
