"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "sirendeck-theme";

/* Theme store: localStorage is the source of truth. useSyncExternalStore
   keeps server/client snapshots hydration-safe with no set-state-in-effect. */

const themeListeners = new Set<() => void>();
let cachedTheme: Theme | null = null;

function parseTheme(v: string | null): Theme {
  return v === "light" || v === "dark" ? v : "system";
}

function getThemeSnapshot(): Theme {
  if (cachedTheme === null) {
    try {
      cachedTheme = parseTheme(localStorage.getItem(STORAGE_KEY));
    } catch {
      cachedTheme = "system";
    }
  }
  return cachedTheme;
}

function subscribeTheme(onChange: () => void): () => void {
  themeListeners.add(onChange);
  return () => {
    themeListeners.delete(onChange);
  };
}

function getServerTheme(): Theme {
  return "system";
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    cachedTheme = parseTheme(e.newValue);
    themeListeners.forEach((l) => l());
  });
}

function setStoredTheme(theme: Theme) {
  cachedTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — in-memory theme still works */
  }
  themeListeners.forEach((l) => l());
}

/* System preference store. */

function subscribeSystem(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
  };
}

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemDark(): boolean {
  return false;
}

/* DOM application. */

export function applyTheme(resolved: Resolved) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/* Animated switch via the View Transitions API: the browser snapshots the
   page, applies the class change, then cross-fades the two snapshots on the
   compositor. One GPU fade replaces hundreds of per-element transitions,
   which is what made the old .theme-switching crossfade stutter. */
function animateThemeChange(resolved: Resolved) {
  if (
    !("startViewTransition" in document) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    applyTheme(resolved);
    return;
  }
  const transition = document.startViewTransition(() => applyTheme(resolved));
  /* ready rejects when a transition is skipped or superseded (rapid clicks,
     hidden tab). The theme is already applied by then; swallow the noise. */
  transition.ready.catch(() => {});
  transition.finished.catch(() => {});
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerTheme,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    getSystemDark,
    getServerSystemDark,
  );

  const resolvedTheme: Resolved =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  /* First paint is handled by the pre-hydration script in layout.tsx; this
     effect keeps the DOM in sync across theme changes and system flips. */
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    setStoredTheme(next);
    const resolved: Resolved =
      next === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : next;
    animateThemeChange(resolved);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
