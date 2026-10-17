import type { Metadata } from "next";
import Link from "next/link";

import { BlocksLoginButton } from "@/components/blocks-login-button";
import { isBlocksLoginConfigured } from "@/lib/blocks/config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to SirenDeck to see your Money Map.",
};

export default function LoginPage() {
  const blocksReady = isBlocksLoginConfigured();

  return (
    <main id="main-content" className="flex min-h-dvh flex-col bg-bg text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-sm items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-baseline gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span aria-hidden className="inline-block size-3 bg-ink" />
            <span className="font-display text-lg font-semibold tracking-[-0.01em]">
              SirenDeck
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <p className="ledger-cap text-[10px] text-ink-muted">Sign in</p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">
            Welcome back
          </h1>
          <p className="text-sm text-ink-muted">Your ledger is where you left it.</p>
        </div>

        {blocksReady ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-dialog)] border border-rule bg-surface p-5 sm:p-6">
            <p className="ledger-cap text-[10px] text-ink-muted">Blocks OS</p>
            <BlocksLoginButton returnTo="/app" />
          </div>
        ) : (
          <p role="alert" className="text-sm text-ink">
            Blocks login is not configured. Copy{" "}
            <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env.local</code> and fill the
            Blocks OS values.
          </p>
        )}

        <Link
          href="/"
          className="mx-auto text-xs text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
