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
 * Sun/Moon swap toggle. Both icons stay mounted and slide/scale between
 * states over 300ms; clicking pins an explicit theme via the provider, so
 * `resolvedTheme` always flips and the icons can derive from it directly.
 */
export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHydrated();

  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={mounted ? `Switch to ${next} theme` : "Change theme"}
      className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-ink transition-opacity duration-150 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          resolvedTheme === "light"
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-5 scale-50 opacity-0"
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          resolvedTheme === "dark"
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-5 scale-50 opacity-0"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}
