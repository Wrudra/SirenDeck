"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ListIcon, MapIcon } from "lucide-react";

/**
 * View tabs. Explicit ?view= wins; with no param the default is
 * viewport-dependent · board list under md, Money Map at md+ (matches the
 * CSS dual-render in the page). Resolved after mount to avoid SSR mismatch;
 * until then explicit views still style correctly.
 *
 * Navigates inside startTransition so the shell stays mounted — no loading
 * skeleton flash when flipping MAP ↔ LEDGER.
 */
export function ViewTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const explicit = params.get("view");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active =
    explicit === "list" ? "list" : explicit === "map" ? "map" : isMobile ? "list" : "map";

  const go = (view: "map" | "list") => {
    const qs = new URLSearchParams();
    for (const [k, v] of params.entries()) {
      if (k !== "view") qs.set(k, v);
    }
    qs.set("view", view);
    startTransition(() => {
      router.push(`/app?${qs.toString()}`, { scroll: false });
    });
  };

  const cls = (isActive: boolean) =>
    `inline-flex h-8 items-center gap-1.5 border-b-2 px-2.5 text-sm font-medium transition-colors duration-150 ease-[var(--ease-out)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
      isActive
        ? "border-ink text-ink"
        : "border-transparent text-ink-muted hover:text-ink"
    }`;

  return (
    <nav aria-label="View" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go("map")}
        aria-current={active === "map" ? "page" : undefined}
        className={cls(active === "map")}
      >
        <MapIcon className="size-3.5" aria-hidden />
        Map
      </button>
      <button
        type="button"
        onClick={() => go("list")}
        aria-current={active === "list" ? "page" : undefined}
        className={cls(active === "list")}
      >
        <ListIcon className="size-3.5" aria-hidden />
        Ledger
      </button>
    </nav>
  );
}
