import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "../auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free SirenDeck account and build your Money Map in minutes.",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  return (
    <main
      id="main-content"
      className="app-frame flex min-h-svh flex-col bg-bg text-ink"
    >
      <header className="chrome border-b border-white/50 pt-[env(safe-area-inset-top)]">
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
            href="/login"
            className="ledger-cap text-[10px] text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <p className="ledger-cap text-[10px] text-ink-muted">Create account</p>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">
            Open your ledger
          </h1>
          <p className="text-sm text-ink-muted">
            Free during early access. No card.
          </p>
        </div>

        <AuthForm mode="signup" />

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Sign in
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
