import Link from "next/link";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { ItemList } from "@/components/items/item-list";
import { MoneyMap } from "@/components/money-map/money-map";
import { FilterBar } from "@/components/shell/filter-bar";
import { ViewTabs } from "@/components/shell/view-tabs";
import { PlusIcon } from "lucide-react";
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
  const view = typeof params.view === "string" ? params.view : null;
  // No explicit view: CSS decides · board list under md, Money Map at md+.
  const isList = view === "list";
  const isMap = view === "map";

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
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-surface px-4 py-2">
        <ViewTabs />
        <ItemFormDialog
          categories={categories}
          trigger={
            <Button
              size="sm"
              data-icon="inline-start"
              id="add-item"
              className="plate rounded-[var(--radius-control)] border-transparent hover:bg-ink"
            >
              <PlusIcon />
              Add item
            </Button>
          }
        />
      </div>

      {items.length === 0 && hasActiveFilters(filters) ? (
        <ZeroResults query={filters.q} view={view} />
      ) : isList ? (
        <ItemList items={items} categories={categories} />
      ) : isMap ? (
        <MoneyMap items={items} categories={categories} />
      ) : (
        /* No explicit view: CSS decides · board list under md, Money Map at md+.
           Both render; each is display:none outside its breakpoint. */
        <>
          <div className="flex min-h-0 flex-1 flex-col md:hidden">
            <ItemList items={items} categories={categories} />
          </div>
          <div className="hidden min-h-0 flex-1 flex-col md:flex">
            <MoneyMap items={items} categories={categories} />
          </div>
        </>
      )}
    </div>
  );
}

/** Keeps the active view when clearing filters — no MAP↔LEDGER jump. */
function ZeroResults({ query, view }: { query: string; view: string | null }) {
  const href =
    view === "map" || view === "list" ? `/app?view=${view}` : "/app";

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <p className="ledger-cap text-[11px] text-ink-muted">No entries match</p>
        <p className="font-display mt-2 text-xl font-semibold tracking-[-0.01em]">
          {query ? <>Nothing in the ledger for “{query}”.</> : "No items match these filters."}
        </p>
        <Link
          href={href}
          className="mt-3 inline-flex h-7 items-center rounded-[var(--radius-control)] border border-rule px-2.5 text-xs text-ink-muted transition-colors duration-150 hover:border-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}
