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
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex h-[3px]"
      >
        <div className="flex-1" style={{ backgroundColor: "var(--urgency-calm)" }} />
        <div className="flex-1" style={{ backgroundColor: "var(--urgency-soon)" }} />
        <div className="flex-1" style={{ backgroundColor: "var(--urgency-urgent)" }} />
        <div className="flex-1" style={{ backgroundColor: "var(--urgency-critical)" }} />
        <div className="flex-1" style={{ backgroundColor: "var(--urgency-overdue)" }} />
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span aria-hidden className="inline-block size-3 bg-ink" />
            <span className="font-display text-xl font-semibold tracking-[-0.01em]">SirenDeck</span>
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">Open your ledger</h1>
          <p className="text-sm text-ink-muted">
            Free during early access. No card required.
          </p>
        </div>

        <AuthForm mode="signup" />

        <p className="text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
            Sign in
          </Link>
        </p>
        <Link href="/" className="text-xs text-ink-muted transition-colors hover:text-ink">
          Back to home
        </Link>
      </div>
    </main>
  );
}
