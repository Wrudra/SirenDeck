import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
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
      <Logo />
      <div className="flex items-center gap-3">
        <span className="hidden max-w-48 truncate text-xs text-ink-muted sm:inline" title={email}>
          {email}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full px-3 py-1.5 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
