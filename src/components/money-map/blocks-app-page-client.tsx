"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { BlocksMoneyMapPage } from "@/components/money-map/blocks-money-map-page";

function Inner() {
  const sp = useSearchParams();
  const searchParams: { [key: string]: string | string[] | undefined } = {};
  sp.forEach((value, key) => {
    const existing = searchParams[key];
    if (existing === undefined) searchParams[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else searchParams[key] = [existing, value];
  });
  return <BlocksMoneyMapPage searchParams={searchParams} />;
}

export function BlocksAppPageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <p className="ledger-cap text-[11px] text-ink-muted">Loading…</p>
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}
