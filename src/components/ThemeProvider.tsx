"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "fiesta";
export const THEMES: Theme[] = ["light", "dark", "fiesta"];

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "dark",
  setTheme: () => {},
});

function isTheme(v: string | null): v is Theme {
  return v === "light" || v === "dark" || v === "fiesta";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    const stored = localStorage.getItem("burrito-theme");
    const initial = isTheme(fromUrl) ? fromUrl : isTheme(stored) ? stored : "dark";
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "fiesta");
    if (theme !== "dark") document.documentElement.classList.add(theme);
    localStorage.setItem("burrito-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
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
  switch (theme) {
    case "light":
      return {
        text: "#7a6c56",
        grid: "rgba(43, 35, 24, 0.07)",
        neutral: "rgba(110, 98, 84, 0.55)",
        crosshair: "#c07d1e",
      };
    case "fiesta":
      return {
        text: "#bda3b3",
        grid: "rgba(245, 233, 224, 0.06)",
        neutral: "rgba(189, 163, 179, 0.5)",
        crosshair: "#ee3d8f",
      };
    default:
      return {
        text: "#a29382",
        grid: "rgba(237, 227, 212, 0.05)",
        neutral: "rgba(162, 147, 130, 0.45)",
        crosshair: "#e6a144",
      };
  }
}
