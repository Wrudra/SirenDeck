"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { ItemList } from "@/components/items/item-list";
import { MoneyMap } from "@/components/money-map/money-map";
import { FilterBar } from "@/components/shell/filter-bar";
import { ViewProvider, ViewStage, ViewTabs } from "@/components/shell/view-tabs";
import { Button } from "@/components/ui/button";
import { getOrSeedCategories, listItems, markDoneItem } from "@/lib/blocks/data";
import { applyFilters, hasActiveFilters, parseFilters } from "@/lib/filters";
import type { CategoryRow, ItemRow } from "@/lib/validation/item";

/**
 * Client Money Map / ledger for Blocks data provider. Seeds default
 * categories on first empty load; single toolbar row matches the main app:
 * search + filters + Map/List tabs + "+ Add" (full item dialog).
 */
export function BlocksMoneyMapPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const view = typeof searchParams.view === "string" ? searchParams.view : null;
  const query = useMemo(() => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value == null) continue;
      for (const v of Array.isArray(value) ? value : [value]) qs.append(key, v);
    }
    return qs.toString();
  }, [searchParams]);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [allItems, setAllItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemById = useMemo(
    () => new Map(allItems.map((row) => [row.id, row])),
    [allItems],
  );

  const reload = useCallback(async () => {
    // No synchronous setState here: the initial load starts with `loading`
    // already true, and every state write happens after the first await.
    try {
      const [cats, items] = await Promise.all([getOrSeedCategories(), listItems()]);
      setCategories(cats);
      setAllItems(items.filter((i) => i.status === "active" || i.status === "snoozed"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Blocks data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDone = useCallback(
    async (item: { id: string }) => {
      const row = itemById.get(item.id);
      if (!row) throw new Error("Item not found");
      await markDoneItem(row);
      await reload();
    },
    [itemById, reload],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [cats, items] = await Promise.all([getOrSeedCategories(), listItems()]);
        if (cancelled) return;
        setCategories(cats);
        setAllItems(items.filter((i) => i.status === "active" || i.status === "snoozed"));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load Blocks data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => applyFilters(allItems, filters), [allItems, filters]);

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
    <ViewProvider serverView={view} query={query}>
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
            onSaved={() => void reload()}
            trigger={
              <Button
                size="sm"
                data-icon="inline-start"
                id="add-item"
                className="plate cursor-pointer rounded-full border-transparent px-3 hover:bg-ink"
              >
                <PlusIcon />
                Add
              </Button>
            }
          />
        </FilterBar>

        {items.length === 0 && hasActiveFilters(filters) ? (
          <ZeroResults query={filters.q} view={view} />
        ) : (
          <ViewStage
            list={<ItemList items={items} categories={categories} onChanged={() => void reload()} />}
            map={
              <MoneyMap
                items={items}
                categories={categories}
                onDone={handleDone}
                onChanged={() => void reload()}
              />
            }
          />
        )}
      </div>
    </ViewProvider>
  );
}

function ZeroResults({ query, view }: { query: string; view: string | null }) {
  const href = view === "map" || view === "list" ? `/app?view=${view}` : "/app";
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
