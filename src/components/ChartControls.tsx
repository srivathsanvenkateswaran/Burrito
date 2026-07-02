"use client";

import { useEffect, useRef, useState } from "react";

/** Fullscreens the closest [data-chart-card] ancestor. */
export function ExpandButton() {
  const ref = useRef<HTMLButtonElement>(null);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    const card = ref.current?.closest("[data-chart-card]") as HTMLElement | null;
    card?.requestFullscreen?.();
  };

  return (
    <button
      ref={ref}
      onClick={toggle}
      aria-label={fs ? "Exit fullscreen" : "Expand chart"}
      title={fs ? "Exit fullscreen" : "Expand chart"}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line text-faint transition-colors hover:border-faint/60 hover:text-fg"
    >
      {fs ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      )}
    </button>
  );
}

/** From/to date inputs; Enter (form submit) applies, ✕ resets to full view. */
export function DateRangeBar({
  min,
  max,
  onApply,
  onReset,
}: {
  min: string;
  max: string;
  onApply: (from: string, to: string) => void;
  onReset: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inputCls =
    "w-[8.2rem] rounded-md border border-line bg-transparent px-2 py-1 font-mono text-xs text-muted outline-none transition-colors focus:border-faint/70 focus:text-fg";

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (from && to && from < to) onApply(from, to);
      }}
    >
      <input
        type="date"
        value={from}
        min={min}
        max={max}
        onChange={(e) => setFrom(e.target.value)}
        aria-label="Range start"
        className={inputCls}
      />
      <span className="text-faint">–</span>
      <input
        type="date"
        value={to}
        min={min}
        max={max}
        onChange={(e) => setTo(e.target.value)}
        aria-label="Range end"
        className={inputCls}
      />
      <button
        type="submit"
        className="rounded-md border border-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-faint/60 hover:text-fg"
      >
        Go
      </button>
      {(from || to) && (
        <button
          type="button"
          aria-label="Reset range"
          onClick={() => {
            setFrom("");
            setTo("");
            onReset();
          }}
          className="rounded-md px-1.5 py-1 font-mono text-xs text-faint transition-colors hover:text-fg"
        >
          ✕
        </button>
      )}
    </form>
  );
}
