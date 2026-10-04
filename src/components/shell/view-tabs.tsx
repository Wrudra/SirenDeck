"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ListIcon, MapIcon } from "lucide-react";

/**
 * View tabs. Explicit ?view= wins; with no param the default is
 * viewport-dependent · board list under md, Money Map at md+ (matches the
 * CSS dual-render in the page). Resolved after mount to avoid SSR mismatch;
 * until then explicit views still style correctly.
 */
export function ViewTabs() {
  const params = useSearchParams();
  const explicit = params.get("view");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = explicit === "list" ? "list" : explicit === "map" ? "map" : isMobile ? "list" : "map";

  const base = new URLSearchParams();
  for (const [k, v] of params.entries()) {
    if (k !== "view") base.set(k, v);
  }
  const href = (view: "map" | "list") => {
    const qs = new URLSearchParams(base);
    qs.set("view", view);
    return `/app?${qs.toString()}`;
  };

  const cls = (isActive: boolean) =>
    `ledger-cap inline-flex h-8 items-center gap-1.5 border-b-2 px-2.5 text-[10px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
      isActive
        ? "border-ink text-ink"
        : "border-transparent text-ink-muted hover:text-ink"
    }`;

  return (
    <nav aria-label="View" className="flex items-center gap-1">
      <Link href={href("map")} aria-current={active === "map" ? "page" : undefined} className={cls(active === "map")}>
        <MapIcon className="size-3.5" aria-hidden />
        Map
      </Link>
      <Link href={href("list")} aria-current={active === "list" ? "page" : undefined} className={cls(active === "list")}>
        <ListIcon className="size-3.5" aria-hidden />
        Ledger
      </Link>
    </nav>
  );
}
