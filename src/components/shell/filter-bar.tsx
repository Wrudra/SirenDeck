"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";

import { cn } from "cn";
import type { CategoryRow } from "@/lib/validation/item";
import type { ItemFilters } from "@/lib/filters";
import { hasActiveFilters } from "@/lib/filters";

const URGENCY_LABELS: Record<string, string> = {
  overdue: "Overdue",
  critical: "This week",
  urgent: "This month",
  soon: "Soon",
  calm: "Calm",
};

const WINDOW_LABELS: Record<string, string> = {
  "30": "30 days",
  "90": "90 days",
  "180": "6 months",
  "365": "1 year",
  all: "Any time",
};

const RENEW_LABELS: Record<string, string> = {
  yes: "Auto-renew",
  no: "Manual",
};

/** Serialized chip descriptors for applied filters. */
function appliedChips(
  filters: ItemFilters,
  categories: CategoryRow[],
): { key: string; label: string; param: string }[] {
  const chips: { key: string; label: string; param: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, param: "q" });
  if (filters.categoryId) {
    const name = categories.find((c) => c.id === filters.categoryId)?.name ?? "Category";
    chips.push({ key: "category", label: name, param: "category" });
  }
  if (filters.urgency) {
    chips.push({ key: "urgency", label: URGENCY_LABELS[filters.urgency], param: "urgency" });
  }
  if (filters.autoRenew != null) {
    chips.push({
      key: "renew",
      label: RENEW_LABELS[filters.autoRenew ? "yes" : "no"],
      param: "renew",
    });
  }
  if (filters.window !== "all") {
    chips.push({ key: "window", label: WINDOW_LABELS[filters.window], param: "window" });
  }
  return chips;
}

export function FilterBar({
  filters,
  categories,
  shownCount,
  totalCount,
}: {
  filters: ItemFilters;
  categories: CategoryRow[];
  shownCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Local input state; syncs from URL when filters.q changes externally
  // (back/forward, clear-all, chip removal) without fighting the debounce.
  // setState-during-render is the React pattern for adjusting derived state;
  // an effect here would cascade renders (and lint rejects it).
  const [q, setQ] = useState(filters.q);
  const [prevUrlQ, setPrevUrlQ] = useState(filters.q);
  if (filters.q !== prevUrlQ) {
    setPrevUrlQ(filters.q);
    setQ(filters.q);
  }

  const setParam = useMemo(() => {
    return (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/app?${qs}` : "/app", { scroll: false });
      });
    };
  }, [router, searchParams]);

  // Debounce keystrokes → URL updates (250ms).
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => setParam({ q: q || null }), 250);
    return () => clearTimeout(t);
  }, [q, filters.q, setParam]);

  const chips = appliedChips(filters, categories);
  const filtering = hasActiveFilters(filters);

  const selectCls =
    "h-7 appearance-none rounded-[var(--radius-control)] border border-rule-input bg-surface pl-2 pr-6 text-xs text-ink outline-none transition-colors hover:border-rule-strong focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50";

  return (
    <div
      role="region"
      aria-label="Filters"
      aria-busy={pending}
      className={cn(
        "flex h-10 items-center gap-2 border-b border-rule bg-surface px-4",
        pending && "opacity-70",
      )}
    >
      {/* search */}
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles or notes…"
          aria-label="Search items"
          className="h-7 w-44 rounded-[var(--radius-control)] border border-rule-input bg-surface pl-7 pr-2 text-xs outline-none transition-colors placeholder:text-ink-muted focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setParam({ q: null });
            }}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[var(--radius-control)] p-0.5 text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <XIcon className="size-3" aria-hidden />
          </button>
        )}
      </div>

      {/* selects */}
      <div className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor="filter-category">Category</label>
        <div className="relative">
          <select
            id="filter-category"
            value={filters.categoryId ?? ""}
            onChange={(e) => setParam({ category: e.target.value || null })}
            className={cn(selectCls, filters.categoryId && "border-ink-muted/50")}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-ink-muted" />
        </div>

        <label className="sr-only" htmlFor="filter-urgency">Urgency</label>
        <div className="relative">
          <select
            id="filter-urgency"
            value={filters.urgency ?? ""}
            onChange={(e) => setParam({ urgency: e.target.value || null })}
            className={cn(selectCls, filters.urgency && "border-ink-muted/50")}
          >
            <option value="">Any urgency</option>
            {Object.entries(URGENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-ink-muted" />
        </div>

        <label className="sr-only" htmlFor="filter-renew">Renewal</label>
        <div className="relative">
          <select
            id="filter-renew"
            value={filters.autoRenew == null ? "" : filters.autoRenew ? "yes" : "no"}
            onChange={(e) =>
              setParam({ renew: e.target.value === "" ? null : e.target.value })
            }
            className={cn(selectCls, filters.autoRenew != null && "border-ink-muted/50")}
          >
            <option value="">Any renewal</option>
            <option value="yes">Auto-renew</option>
            <option value="no">Manual</option>
          </select>
          <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-ink-muted" />
        </div>

        <label className="sr-only" htmlFor="filter-window">Time window</label>
        <div className="relative">
          <select
            id="filter-window"
            value={filters.window}
            onChange={(e) =>
              setParam({ window: e.target.value === "all" ? null : e.target.value })
            }
            className={cn(selectCls, filters.window !== "all" && "border-ink-muted/50")}
          >
            {Object.entries(WINDOW_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      {/* count + clear */}
      <div className="ml-auto flex items-center gap-2">
        {filtering && (
          <>
            <span className="hidden text-xs text-ink-muted sm:inline">
              {shownCount} of {totalCount}
            </span>
            <button
              type="button"
              onClick={() => {
                setQ("");
                startTransition(() => router.push("/app", { scroll: false }));
              }}
              className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-control)] border border-rule px-2 text-xs text-ink-muted transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <XIcon className="size-3" aria-hidden />
              Clear all
            </button>
          </>
        )}
      </div>

      {/* applied chips · visible on small screens where selects may scroll away */}
      {chips.length > 0 && (
        <ul className="hidden items-center gap-1 md:flex" aria-label="Applied filters">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => setParam({ [chip.param]: null })}
                aria-label={`Remove filter: ${chip.label}`}
                className="inline-flex h-6 max-w-40 items-center gap-1 rounded-[var(--radius-control)] border border-rule bg-surface-2 px-2 text-[11px] text-ink transition-colors hover:text-ink-muted"
              >
                <span className="truncate">{chip.label}</span>
                <XIcon className="size-2.5 shrink-0" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
