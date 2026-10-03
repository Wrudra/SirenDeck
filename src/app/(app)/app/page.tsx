import Link from "next/link";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { ItemList } from "@/components/items/item-list";
import { MoneyMap } from "@/components/money-map/money-map";
import { FilterBar } from "@/components/shell/filter-bar";
import { ListIcon, MapIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrSeedCategories } from "@/lib/categories";
import { applyFilters, hasActiveFilters, parseFilters } from "@/lib/filters";
import { requireUser } from "@/lib/supabase/require-user";
import type { ItemRow } from "@/lib/validation/item";

export const dynamic = "force-dynamic";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, supabase } = await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);
  const view = typeof params.view === "string" ? params.view : "map";
  const isList = view === "list";

  const [categories, itemsResult] = await Promise.all([
    getOrSeedCategories(supabase, user.id),
    supabase
      .from("items")
      .select("*")
      .in("status", ["active", "snoozed"])
      .order("due_date", { ascending: true }),
  ]);

  const allItems = (itemsResult.data ?? []) as ItemRow[];
  const items = applyFilters(allItems, filters);

  return (
    <div className="flex flex-1 flex-col">
      <FilterBar
        filters={filters}
        categories={categories}
        shownCount={items.length}
        totalCount={allItems.length}
      />
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
        <div role="tablist" aria-label="View" className="flex items-center gap-1">
          <Link
            href={linkFor("/app", params)}
            aria-current={!isList ? "page" : undefined}
            className={`inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-xs transition-colors ${
              !isList
                ? "border-border-subtle bg-surface-2 text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <MapIcon className="size-3.5" aria-hidden />
            Map
          </Link>
          <Link
            href={linkFor("/app?view=list", params)}
            aria-current={isList ? "page" : undefined}
            className={`inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 text-xs transition-colors ${
              isList
                ? "border-border-subtle bg-surface-2 text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            <ListIcon className="size-3.5" aria-hidden />
            List
          </Link>
        </div>
        <ItemFormDialog
          categories={categories}
          trigger={
            <Button size="sm" data-icon="inline-start" id="add-item">
              <PlusIcon />
              Add item
            </Button>
          }
        />
      </div>

      {items.length === 0 && hasActiveFilters(filters) ? (
        <ZeroResults query={filters.q} />
      ) : isList ? (
        <ItemList items={items} categories={categories} />
      ) : (
        <MoneyMap items={items} categories={categories} />
      )}
    </div>
  );
}

/** Keeps filter params when switching views. */
function linkFor(href: string, params: Record<string, string | string[] | undefined>): string {
  const url = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "view") continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (v) url.set(key, v);
  }
  const [base, existing] = href.split("?");
  const merged = new URLSearchParams(existing ?? "");
  for (const [k, v] of url.entries()) merged.set(k, v);
  const qs = merged.toString();
  return qs ? `${base}?${qs}` : base;
}

function ZeroResults({ query }: { query: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <p className="text-sm font-medium">
          {query ? <>No results for “{query}”</> : "No items match these filters"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Try a different term, or clear the filters to see everything.
        </p>
        <Link
          href="/app"
          className="mt-3 inline-flex h-7 items-center rounded-[var(--radius-control)] border border-border-subtle px-2.5 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}
