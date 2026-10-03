import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { ItemList } from "@/components/items/item-list";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrSeedCategories } from "@/lib/categories";
import { requireUser } from "@/lib/supabase/require-user";
import type { ItemRow } from "@/lib/validation/item";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const { user, supabase } = await requireUser();

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
        <p className="text-sm font-medium">All items</p>
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
      <ItemList items={items} categories={categories} />
    </div>
  );
}
