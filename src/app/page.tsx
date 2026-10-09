import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { DepartureBoard } from "@/components/marketing/departure-board";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SirenDeck: see everything that renews, before it costs you",
  description:
    "One map of every subscription, bill, insurance, domain, and document renewal. Closer deadlines grow larger. Color shows how urgent.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/app");

  return (
    <div className="min-h-svh bg-bg text-ink">
      <header className="chrome sticky top-0 z-50 border-b border-white/50 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="plate rounded-[var(--radius-control)] px-3.5 py-1.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 md:pt-24">
          <h1 className="font-display max-w-[14ch] text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-balance">
            Every deadline, before it costs you
          </h1>
          <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
            Subscriptions, bills, and documents on one map. A tile grows as the date gets closer. Green is calm, red is past due.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="plate inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] px-5 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Create a free account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-rule-strong px-5 text-base font-medium transition-colors hover:border-ink/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-14">
            <DepartureBoard />
          </div>
        </section>
      </main>

      <footer className="px-6 pb-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-ink-muted">
          <p>© {new Date().getFullYear()} SirenDeck</p>
          <a href="mailto:hello@sirendeck.app" className="transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
