"use client";

import { THEMES, type Theme, useTheme } from "./ThemeProvider";

const ICONS: Record<Theme, React.ReactNode> = {
  light: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  fiesta: <span className="text-[11px] leading-none">🌶</span>,
};

/** Three-stop theme slider: light / dark / fiesta, with a sliding thumb. */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const idx = THEMES.indexOf(theme);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative flex h-8 items-center rounded-md border border-line bg-surface/60 p-0.5"
    >
      <span
        aria-hidden
        className="absolute h-[26px] w-[30px] rounded-[5px] bg-raise shadow-[inset_0_0_0_1px_var(--line)] transition-transform duration-200"
        style={{ transform: `translateX(${idx * 30}px)` }}
      />
      {THEMES.map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          aria-label={`${t} theme`}
          title={`${t} theme`}
          onClick={() => setTheme(t)}
          className={`relative z-10 flex h-[26px] w-[30px] items-center justify-center rounded-[5px] transition-colors ${
            theme === t ? "text-fg" : "text-faint hover:text-muted"
          }`}
        >
          {ICONS[t]}
        </button>
      ))}
    </div>
  );
}
