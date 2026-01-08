import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const THEMES = ["cute", "dark", "minimal"];
const STORAGE_KEY = "app_theme_v1";

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme) {
  const t = THEMES.includes(theme) ? theme : "cute";
  document.documentElement.setAttribute("data-theme", t);
  document.documentElement.style.colorScheme = t === "dark" ? "dark" : "light";
}

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("cute");

  useLayoutEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const t = THEMES.includes(saved) ? saved : "cute";
    setThemeState(t);
    applyTheme(t);
  }, []);

  function setTheme(t) {
    const next = THEMES.includes(t) ? t : "cute";
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
