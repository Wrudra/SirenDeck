"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useTheme } from "@/components/theme-provider";

const emptySubscribe = () => () => {};
const getHydrated = () => true;
const getNotHydrated = () => false;

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, getHydrated, getNotHydrated);
}

/**
 * Toggles light ↔ dark, pinning an explicit theme on every click. Shows the
 * effective theme; fixed Sun icon until hydrated so SSR markup matches the
 * client regardless of the stored theme.
 */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={
        mounted ? `Switch to ${next} theme` : "Change theme"
      }
      title={mounted ? `Theme: ${resolvedTheme}` : undefined}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
