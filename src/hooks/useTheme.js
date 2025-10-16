import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "theme";

/**
 * Synchronizes the selected color theme across the app and localStorage.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const isDark = theme === "dark";

    root.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme,
  };
}
