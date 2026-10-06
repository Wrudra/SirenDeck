"use client";

import { useBlocksAuth } from "@/components/blocks-auth-provider";

export function BlocksTopBar({ email }: { email: string }) {
  const { logout } = useBlocksAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-rule bg-surface px-4">
      <div className="flex items-baseline gap-2.5">
        <span aria-hidden className="mt-1 inline-block size-3 bg-ink" />
        <span className="font-display text-lg font-semibold tracking-[-0.01em]">SirenDeck</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="ledger-cap hidden max-w-48 truncate text-[9px] text-ink-muted sm:inline"
          title={email}
        >
          {email}
        </span>
        <button
          type="button"
          onClick={() => {
            void logout().then(() => {
              window.location.href = "/login";
            });
          }}
          className="rounded-[var(--radius-control)] border border-rule-strong px-3 py-1.5 text-sm text-ink-muted transition-colors duration-150 hover:border-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
