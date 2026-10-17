"use client";

import { useBlocksAuth } from "@/components/blocks-auth-provider";
import { Logo } from "@/components/brand/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function BlocksTopBar({ email }: { email: string }) {
  const { logout } = useBlocksAuth();

  return (
    <header className="chrome flex min-h-14 shrink-0 items-center justify-between border-b border-white/50 px-4 pt-[env(safe-area-inset-top)] dark:border-rule">
      <Logo />
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <span
          className="hidden max-w-48 truncate text-xs text-ink-muted sm:inline"
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
          className="rounded-full px-3 py-1.5 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
