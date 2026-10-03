import Link from "next/link";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { ItemList } from "@/components/items/item-list";
import { MoneyMap } from "@/components/money-map/money-map";
import { ListIcon, MapIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrSeedCategories } from "@/lib/categories";
import { requireUser } from "@/lib/supabase/require-user";
import type { ItemRow } from "@/lib/validation/item";

export const dynamic = "force-dynamic";

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { user, supabase } = await requireUser();
  const { view } = await searchParams;
  const isList = view === "list";

  const [categories, itemsResult] = await Promise.all([
    getOrSeedCategories(supabase, user.id),
    supabase
      .from("items")
      .select("*")
      .in("status", ["active", "snoozed"])
      .order("due_date", { ascending: true }),
  ]);

  const items = (itemsResult.data ?? []) as ItemRow[];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2">
        {/* view toggle — shareable via ?view= */}
        <div role="tablist" aria-label="View" className="flex items-center gap-1">
          <Link
            href="/app"
            aria-current={isList ? undefined : "page"}
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
            href="/app?view=list"
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
            <Button size="sm" data-icon="inline-start">
              <PlusIcon />
              Add item
            </Button>
          }
        />
      </div>
      {isList ? (
        <ItemList items={items} categories={categories} />
      ) : (
        <MoneyMap items={items} categories={categories} />
      )}
    </div>
  );
}
