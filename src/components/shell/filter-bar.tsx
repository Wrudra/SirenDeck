"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  if (filters.q) chips.push({ key: "q", label: `\u201c${filters.q}\u201d`, param: "q" });
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

/** Keep the active view when wiping filters so MAP\leftrightarrow LEDGER does not jump. */
function clearFilterParams(searchParams: URLSearchParams): string {
  const params = new URLSearchParams();
  const view = searchParams.get("view");
  if (view === "map" || view === "list") params.set("view", view);
  const qs = params.toString();
  return qs ? `/app?${qs}` : "/app";
}

export function FilterBar({
  filters,
  categories,
  shownCount,
  totalCount,
  children,
}: {
  filters: ItemFilters;
  categories: CategoryRow[];
  shownCount: number;
  totalCount: number;
  children?: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const searchRef = useRef(searchParams);
  searchRef.current = searchParams;
  const inputRef = useRef<HTMLInputElement>(null);

  // The field owns what the user is typing. The URL is applied back only
  // when focus is elsewhere (back/forward, clear, chip), so keystrokes
  // are never replaced by a slower server render.
  const [q, setQ] = useState(filters.q);
  const [prevUrlQ, setPrevUrlQ] = useState(filters.q);
  if (filters.q !== prevUrlQ) {
    setPrevUrlQ(filters.q);
    const focused =
      typeof document !== "undefined" && document.activeElement === inputRef.current;
    if (!focused) setQ(filters.q);
  }

  const setParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchRef.current.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "" || value === "all") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/app?${qs}` : "/app", { scroll: false });
    });
  };

  useEffect(() => {
    if (q === filters.q) return;
    const handle = window.setTimeout(() => setParam({ q: q || null }), 200);
    return () => window.clearTimeout(handle);
    // setParam reads the latest params from a ref. Listing it would
    // reschedule the debounce on every URL write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters.q]);

  const chips = appliedChips(filters, categories);
  const filtering = hasActiveFilters(filters);

  return (
    <div
      role="region"
      aria-label="Filters"
      className="flex flex-col gap-2 border-b border-rule bg-surface px-3 py-2 sm:flex-row sm:items-center sm:gap-2 sm:px-4 sm:py-2"
    >
      <div className="flex min-w-0 items-center gap-2">
        {/* search */}
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
          />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles or notes…"
            aria-label="Search items"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-7 w-full rounded-[var(--radius-control)] border border-rule-input bg-surface pl-7 pr-7 text-xs outline-none transition-colors duration-150 placeholder:text-ink-muted focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50 sm:w-56 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setParam({ q: null });
              }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-[var(--radius-control)] p-0.5 text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <XIcon className="size-3" aria-hidden />
            </button>
          )}
        </div>

        {/* count + clear · always reachable on mobile */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:hidden">
          {filtering && (
            <>
              <span className="tabular text-xs text-ink-muted" style={{ fontFamily: "var(--font-mono-var)" }}>
                {shownCount}/{totalCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  startTransition(() => {
                    router.push(clearFilterParams(new URLSearchParams(searchParams.toString())), {
                      scroll: false,
                    });
                  });
                }}
                className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-control)] border border-rule px-2 text-xs text-ink-muted transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <XIcon className="size-3" aria-hidden />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:overflow-x-auto sm:pb-0">
        <FilterSelect
          label="Category"
          value={filters.categoryId ?? "all"}
          active={Boolean(filters.categoryId)}
          onChange={(value) => setParam({ category: value === "all" ? null : value })}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect
          label="Urgency"
          value={filters.urgency ?? "all"}
          active={Boolean(filters.urgency)}
          onChange={(value) => setParam({ urgency: value === "all" ? null : value })}
          options={[
            { value: "all", label: "Any urgency" },
            ...Object.entries(URGENCY_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Renewal"
          value={filters.autoRenew == null ? "all" : filters.autoRenew ? "yes" : "no"}
          active={filters.autoRenew != null}
          onChange={(value) => setParam({ renew: value === "all" ? null : value })}
          options={[
            { value: "all", label: "Any renewal" },
            { value: "yes", label: "Auto-renew" },
            { value: "no", label: "Manual" },
          ]}
        />
        <FilterSelect
          label="Time window"
          value={filters.window}
          active={filters.window !== "all"}
          onChange={(value) => setParam({ window: value === "all" ? null : value })}
          options={Object.entries(WINDOW_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
        {filtering && (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="tabular text-xs text-ink-muted" style={{ fontFamily: "var(--font-mono-var)" }}>
              {shownCount} of {totalCount}
            </span>
            <button
              type="button"
              onClick={() => {
                setQ("");
                startTransition(() => {
                  router.push(clearFilterParams(new URLSearchParams(searchParams.toString())), {
                    scroll: false,
                  });
                });
              }}
              className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-control)] border border-rule px-2 text-xs text-ink-muted transition-colors hover:border-rule-strong hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <XIcon className="size-3" aria-hidden />
              Clear all
            </button>
          </div>
        )}
        {children}
      </div>

      {/* applied chips */}
      {chips.length > 0 && (
        <ul
          className="flex flex-wrap items-center gap-1 sm:flex-nowrap"
          aria-label="Applied filters"
        >
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => setParam({ [chip.param]: null })}
                aria-label={`Remove filter: ${chip.label}`}
                className="inline-flex h-6 max-w-40 items-center gap-1 rounded-[var(--radius-control)] border border-rule bg-surface-2 px-2 text-[11px] text-ink transition-colors hover:border-rule-strong hover:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
  active,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  active?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn(
          "h-7 cursor-pointer rounded-[var(--radius-control)] border-rule-input bg-surface px-2 text-xs text-ink shadow-none",
          "transition-colors duration-150 ease-[var(--ease-out)] hover:border-rule-strong",
          "focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50",
          active && "border-ink-muted/50",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={6}
        className="rounded-[var(--radius-control)]"
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="cursor-pointer text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
