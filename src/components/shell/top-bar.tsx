import { redirect } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export function TopBar({ email }: { email: string }) {
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-5 rounded-[6px] bg-urgency-overdue"
        />
        <span className="text-sm font-semibold tracking-wide">SirenDeck</span>
        <span className="ml-3 hidden text-xs text-ink-muted md:inline">
          what renews soon, and what it costs
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Add-item lives in the page header; this ghost link keeps the bar honest */}
        <a
          href="#add-item"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 py-1.5 text-sm font-medium text-cta transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          <PlusIcon className="size-4" aria-hidden />
          Add item
        </a>
        <span className="hidden max-w-48 truncate text-xs text-ink-muted sm:inline" title={email}>
          {email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[var(--radius-control)] border border-border-subtle px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
