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
import { planSettlement } from "@/lib/map/cycle";
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

  const loaded = (itemsResult.data ?? []) as ItemRow[];
  const allItems = await settleOpenItems(supabase, loaded);
  const items = applyFilters(allItems, filters);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilterBar
        filters={filters}
        categories={categories}
        shownCount={items.length}
        totalCount={allItems.length}
      >
        <ViewTabs />
        <ItemFormDialog
          categories={categories}
          trigger={
            <Button
              size="sm"
              data-icon="inline-start"
              id="add-item"
              className="plate rounded-full border-transparent px-3 hover:bg-ink"
            >
              <PlusIcon />
              Add
            </Button>
          }
        />
      </FilterBar>

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

/**
 * On open: a one-off that is already the day after its due date is marked
 * done. A renewal rolls forward until the countdown is today or later.
 */
async function settleOpenItems(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  items: ItemRow[],
): Promise<ItemRow[]> {
  const now = new Date();
  const settled = await Promise.all(
    items.map(async (item) => {
      const plan = planSettlement(item, now);
      if (plan.kind === "keep") return item;
      if (plan.kind === "done") {
        const { error } = await supabase
          .from("items")
          .update({
            status: "done",
            completed_at: now.toISOString(),
            snoozed_until: null,
          })
          .eq("id", item.id);
        return error ? item : null;
      }
      const { error } = await supabase
        .from("items")
        .update({
          due_date: plan.dueDate,
          status: "active",
          snoozed_until: null,
        })
        .eq("id", item.id);
      if (error) return item;
      return { ...item, due_date: plan.dueDate, status: "active" as const, snoozed_until: null };
    }),
  );
  return settled.filter((item): item is ItemRow => item != null);
}

/** Keeps the active view when clearing filters — no MAP↔LEDGER jump. */
function ZeroResults({ query, view }: { query: string; view: string | null }) {
  const href =
    view === "map" || view === "list" ? `/app?view=${view}` : "/app";

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="text-center">
        <p className="text-xl font-semibold tracking-[-0.02em]">
          {query ? <>Nothing matches “{query}”.</> : "Nothing matches these filters."}
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
