import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export function TopBar({ email }: { email: string }) {
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-5 rounded-[6px] bg-urgency-overdue"
        />
        <span className="text-sm font-semibold tracking-wide">SirenDeck</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-[var(--radius-control)] bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          Add item
        </button>
        <span className="hidden text-xs text-ink-muted sm:inline">{email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[var(--radius-control)] border border-border-subtle px-3 py-1.5 text-sm text-ink-muted hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
