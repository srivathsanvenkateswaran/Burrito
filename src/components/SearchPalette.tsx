"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CHARTS } from "@/lib/charts";

interface Entry {
  href: string;
  title: string;
  category: string;
  description: string;
}

const ENTRIES: Entry[] = [
  { href: "/dashboard", title: "Dashboard", category: "Pages", description: "Stats, hero chart, and the full chart index." },
  { href: "/", title: "Home", category: "Pages", description: "Landing page with today's read." },
  ...CHARTS.map((c) => ({
    href: `/charts/${c.slug}`,
    title: c.title,
    category: c.category,
    description: c.description,
  })),
];

/** Rank: title prefix > title substring > category > description. 0 = no match. */
function score(entry: Entry, q: string): number {
  const t = entry.title.toLowerCase();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;
  let total = 0;
  for (const w of words) {
    if (t.startsWith(w)) total += 100;
    else if (t.includes(w)) total += 50;
    else if (entry.category.toLowerCase().includes(w)) total += 25;
    else if (entry.description.toLowerCase().includes(w)) total += 10;
    else return 0; // every word must match somewhere
  }
  return total;
}

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const scored = ENTRIES.map((e) => ({ e, s: score(e, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.slice(0, 12).map((r) => r.e);
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search charts"
        className="flex h-8 items-center gap-2 rounded-md border border-line px-2.5 text-muted transition-colors hover:border-faint/60 hover:text-fg"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden text-xs sm:inline">Search</span>
        <kbd className="hidden rounded border border-line px-1 font-mono text-[10px] text-faint sm:inline">
          ⌘K
        </kbd>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
            <button
              aria-label="Close search"
              onClick={close}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-lg rounded-xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center gap-2 border-b border-line/70 px-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-faint">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSelected((s) => Math.min(s + 1, results.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSelected((s) => Math.max(s - 1, 0));
                    } else if (e.key === "Enter" && results[selected]) {
                      go(results[selected].href);
                    }
                  }}
                  placeholder="Search 99 charts… (risk, halving, inflation, MVRV)"
                  className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-faint"
                />
              </div>
              <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
                {results.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-faint">
                    No charts match &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  results.map((r, i) => (
                    <button
                      key={r.href}
                      data-idx={i}
                      onClick={() => go(r.href)}
                      onMouseEnter={() => setSelected(i)}
                      className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        i === selected ? "bg-raise" : ""
                      }`}
                    >
                      <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                        {r.category}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm text-fg">{r.title}</span>
                        <span className="block truncate text-xs text-muted">{r.description}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <div className="flex gap-4 border-t border-line/70 px-4 py-2 font-mono text-[10px] text-faint">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
