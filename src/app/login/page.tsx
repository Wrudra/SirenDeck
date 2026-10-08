import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to SirenDeck to see your Money Map.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col bg-bg text-ink"
    >
      {/* Ruled masthead — shell craft, no decorative urgency ramp */}
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
          <Link
            href="/signup"
            className="ledger-cap text-[10px] text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open account
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <p className="ledger-cap text-[10px] text-ink-muted">Sign in</p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">
            Welcome back
          </h1>
          <p className="text-sm text-ink-muted">
            Use the email and password for this ledger.
          </p>
        </div>

        <AuthForm mode="login" />

        <p className="text-center text-sm text-ink-muted">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open one free
          </Link>
        </p>
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
