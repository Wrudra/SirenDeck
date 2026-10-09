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
    <header className="chrome flex min-h-14 shrink-0 items-center justify-between border-b border-white/50 px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex items-baseline gap-2.5">
        <span aria-hidden className="inline-block size-2.5 rounded-[4px] bg-ink" />
        <span className="font-display text-lg font-semibold tracking-[-0.01em]">SirenDeck</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="ledger-cap hidden max-w-48 truncate text-[9px] text-ink-muted sm:inline"
          title={email}
        >
          {email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-[var(--radius-control)] border border-rule-strong px-3 py-1.5 text-sm text-ink-muted transition-colors duration-150 hover:border-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
