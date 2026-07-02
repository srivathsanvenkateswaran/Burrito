"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    const stored = localStorage.getItem("burrito-theme");
    const initial = fromUrl === "light" || fromUrl === "dark" ? fromUrl : stored;
    if (initial === "light") setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("burrito-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Canvas colors for lightweight-charts, per theme (CSS vars can't reach canvas). */
export function useChartColors() {
  const { theme } = useTheme();
  return useMemo(() => chartColors(theme), [theme]);
}

function chartColors(theme: Theme) {
  return theme === "light"
    ? {
        text: "#7a6c56",
        grid: "rgba(43, 35, 24, 0.07)",
        neutral: "rgba(110, 98, 84, 0.55)",
        crosshair: "#c07d1e",
      }
    : {
        text: "#a29382",
        grid: "rgba(237, 227, 212, 0.05)",
        neutral: "rgba(162, 147, 130, 0.45)",
        crosshair: "#e6a144",
      };
}
