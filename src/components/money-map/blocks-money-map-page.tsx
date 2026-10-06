"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { ItemList } from "@/components/items/item-list";
import { MoneyMap } from "@/components/money-map/money-map";
import { FilterBar } from "@/components/shell/filter-bar";
import { ViewTabs } from "@/components/shell/view-tabs";
import { Button } from "@/components/ui/button";
import {
  createItem,
  getOrSeedCategories,
  listItems,
} from "@/lib/blocks/data";
import { applyFilters, hasActiveFilters, parseFilters } from "@/lib/filters";
import type { CategoryRow, ItemRow } from "@/lib/validation/item";

/**
 * Client Money Map / ledger for Blocks data provider.
 * Seeds default categories on first empty load; Item create is minimal (title+category+due)
 * so the map can show seeded empty state and accept a first item without Supabase actions.
 */
export function BlocksMoneyMapPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const view = typeof searchParams.view === "string" ? searchParams.view : null;
  const isList = view === "list";
  const isMap = view === "map";

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [allItems, setAllItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, items] = await Promise.all([getOrSeedCategories(), listItems()]);
      setCategories(cats);
      setAllItems(items.filter((i) => i.status === "active" || i.status === "snoozed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Blocks data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const items = useMemo(() => applyFilters(allItems, filters), [allItems, filters]);

  async function onQuickAdd() {
    if (!categories.length) {
      toast.error("No categories yet — wait for seed to finish.");
      return;
    }
    setAdding(true);
    try {
      const due = new Date();
      due.setDate(due.getDate() + 30);
      const dueDate = due.toISOString().slice(0, 10);
      await createItem({
        categoryId: categories[0].id,
        title: "Sample item",
        notes: null,
        dueDate,
        recurrence: "none",
        autoRenews: false,
        amount: null,
        currency: "BDT",
      });
      toast.success("Item created on Blocks");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="ledger-cap text-[11px] text-ink-muted">Loading Money Map…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="font-display text-lg font-semibold">Could not load Blocks data</p>
        <p className="max-w-md text-center text-sm text-ink-muted">{error}</p>
        <Button size="sm" variant="outline" onClick={() => void reload()}>
          Retry
        </Button>
      </div>
    );
  }

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
        <Button
          size="sm"
          data-icon="inline-start"
          id="add-item"
          disabled={adding || categories.length === 0}
          onClick={() => void onQuickAdd()}
          className="plate rounded-[var(--radius-control)] border-transparent hover:bg-ink"
        >
          <PlusIcon />
          {adding ? "Adding…" : "Add sample item"}
        </Button>
      </div>

      {items.length === 0 && hasActiveFilters(filters) ? (
        <ZeroResults query={filters.q} view={view} />
      ) : isList ? (
        <ItemList items={items} categories={categories} />
      ) : isMap ? (
        <MoneyMap items={items} categories={categories} />
      ) : (
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

function ZeroResults({ query, view }: { query: string; view: string | null }) {
  const href = view === "map" || view === "list" ? `/app?view=${view}` : "/app";
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
