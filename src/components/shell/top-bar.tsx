import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { createClient } from "@/lib/supabase/server";
import { getOrSeedCategories } from "@/lib/categories";
import type { CategoryRow } from "@/lib/validation/item";

export async function TopBar({ email }: { email: string }) {
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const categories: CategoryRow[] = user
    ? await getOrSeedCategories(supabase, user.id)
    : [];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-rule bg-surface px-4">
      <div className="flex items-baseline gap-2.5">
        <span aria-hidden className="mt-1 inline-block size-3 bg-ink" />
        <span className="font-display text-lg font-semibold tracking-[-0.01em]">SirenDeck</span>
        <span className="ledger-cap ml-3 hidden text-[9px] text-ink-muted md:inline">
          what renews soon · what it costs
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ItemFormDialog
          categories={categories}
          trigger={
            <button
              type="button"
              id="add-item"
              data-icon="inline-start"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-ink px-2.5 py-1.5 text-sm font-medium text-cta-ink transition-colors hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <PlusIcon className="size-4" aria-hidden />
              Add item
            </button>
          }
        />
        <span className="ledger-cap hidden max-w-48 truncate text-[9px] text-ink-muted sm:inline" title={email}>
          {email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[var(--radius-control)] border border-rule-strong px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
