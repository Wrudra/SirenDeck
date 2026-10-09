import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/**
 * Sign-in surfaces. The map sits on the left; the form is a column, not a card
 * floating in the middle of a blank page.
 */
export function AuthSplit({
  title,
  lede,
  prompt,
  alternateHref,
  alternateLabel,
  children,
}: {
  title: string;
  lede: string;
  prompt: string;
  alternateHref: string;
  alternateLabel: string;
  children: ReactNode;
}) {
  return (
    <main id="main-content" className="app-frame grid min-h-svh bg-bg text-ink lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#141416] text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Link
          href="/"
          className="relative z-10 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Logo onDark />
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="text-4xl font-semibold tracking-[-0.03em] text-balance">
            What is due, and what it costs.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            Deadlines fill the map. The sooner one is, the larger it gets. Green is calm. Red is past due.
          </p>
        </div>
        <div aria-hidden className="relative z-10 grid h-28 grid-cols-6 grid-rows-3 gap-1.5">
          <div className="col-span-2 row-span-3 rounded-xl bg-[color-mix(in_srgb,var(--heat-overdue)_24%,white)]" />
          <div className="col-span-2 row-span-2 rounded-xl bg-[color-mix(in_srgb,var(--heat-urgent)_32%,white)]" />
          <div className="col-span-2 row-span-2 rounded-xl bg-[color-mix(in_srgb,var(--heat-critical)_28%,white)]" />
          <div className="col-span-2 rounded-xl bg-[color-mix(in_srgb,var(--heat-soon)_28%,white)]" />
          <div className="rounded-xl bg-[color-mix(in_srgb,var(--heat-calm)_22%,white)]" />
          <div className="rounded-xl bg-[color-mix(in_srgb,var(--heat-calm)_22%,white)]" />
        </div>
      </section>

      <section className="flex min-h-svh flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="lg:invisible focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          <Link
            href={alternateHref}
            className="text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {alternateLabel}
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{lede}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-ink-muted">
            {prompt}{" "}
            <Link
              href={alternateHref}
              className="font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {alternateLabel}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
