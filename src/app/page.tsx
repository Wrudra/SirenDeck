import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DepartureBoard } from "@/components/marketing/departure-board";
import { Reveal } from "@/components/marketing/reveal";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SirenDeck: see everything that renews, before it costs you",
  description:
    "One map of every subscription, bill, insurance, domain and document renewal. Sized by cost, shaded by urgency. Know what is due and what it costs you, at a glance.",
};

const RAMP = [
  { label: "Calm", note: "over 90 days out" },
  { label: "Soon", note: "inside 90" },
  { label: "Urgent", note: "inside 30" },
  { label: "Critical", note: "inside 7" },
  { label: "Past due", note: "departed" },
];

const TRACKABLE = [
  "Subscriptions",
  "Insurance",
  "Bills",
  "Domains & SSL",
  "Licenses",
  "Warranties",
  "Passports & visas",
];

const FAQ = [
  {
    q: "What kinds of things should I track here?",
    a: "Anything with a deadline that costs money or expires: subscriptions, insurance premiums, internet and utility bills, domain and SSL renewals, software licenses, warranties, passports, visas and professional memberships.",
  },
  {
    q: "Does it cost anything?",
    a: "SirenDeck is free while in early access. Accounts created now keep their data when paid plans arrive. No card is required to sign up.",
  },
  {
    q: "Which currencies are supported?",
    a: "Bangladeshi taka is the default, with per item overrides for US dollars and euros. Totals group per currency, so mixed lists never produce fake sums.",
  },
  {
    q: "How do reminders work?",
    a: "A scheduled job checks due dates daily and queues reminder emails ahead of each deadline. Reminders only go to the address on your account.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. Everything you enter can be exported at any time from your account. No lock in, no hostage data.",
  },
  {
    q: "Is my financial data safe here?",
    a: "SirenDeck never connects to your bank. You enter only what a deadline needs: a name, a cost and a date. Traffic is encrypted and every account's rows are isolated at the database layer.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/app");

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* ── Masthead: ruled newspaper rail, not a floating island ─────── */}
      <header className="sticky top-0 z-50 border-b border-rule bg-bg/92 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span aria-hidden className="inline-block size-3 bg-ink" />
            <span className="font-display text-xl font-semibold tracking-[-0.01em]">SirenDeck</span>
          </Link>
          <div className="flex items-center gap-6">
            <a
              className="hidden text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline"
              href="#faq"
            >
              FAQ
            </a>
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
        {/* ── Hero: the front page · serif manifesto over the living ledger ── */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-14 md:pt-28">
          <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_1fr]">
            <Reveal>
              <p className="ledger-cap text-[11px] text-ink-muted">The ledger of everything due</p>
              <h1
                className="font-display mt-4 max-w-[560px] text-[clamp(2.6rem,5.4vw,4.2rem)] leading-[1.02] font-semibold tracking-[-0.015em] text-balance"
              >
                Every renewal, entered and answered, before it costs you
              </h1>
              <p
                className="mt-5 max-w-[520px] text-lg leading-relaxed text-ink-muted"
                style={{ textWrap: "pretty" }}
              >
                SirenDeck keeps a ledger of your money&rsquo;s deadlines. Each entry is sized
                by what it costs you a year and shaded by how soon it comes due.
                The nearer the date, the darker the ink. What renews soon sits
                at the top of the page, already ranked.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="plate inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] px-5 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  Open your free ledger
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-rule-strong px-5 text-base font-medium transition-colors hover:border-ink/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  I already have an account
                </Link>
              </div>
              <p className="mt-5 text-xs tracking-wide text-ink-muted">
                No card required · Data exportable anytime · BDT, USD and EUR
              </p>
            </Reveal>
          </div>

          {/* the board is the demo · live, synthetic, labeled */}
          <Reveal delayMs={140} className="mt-14">
            <DepartureBoard />
          </Reveal>
        </section>

        {/* ── The ramp: five shades, fixed · the second beat ──────────── */}
        <section aria-labelledby="ramp-title" className="border-t-2 border-ink">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal as="h2" id="ramp-title" className="ledger-cap text-[11px] text-ink-muted">
              The five shades of due
            </Reveal>
            <ol className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-ink bg-rule lg:grid-cols-5 sm:grid-cols-3">
              {RAMP.map((step, i) => (
                <li key={step.label} className="bg-surface p-5">
                  <span
                    aria-hidden
                    className="block h-3 w-full"
                    style={{ backgroundColor: `var(--urgency-${["calm", "soon", "urgent", "critical", "overdue"][i]})` }}
                  />
                  <span className="ledger-cap mt-4 block text-[10px] text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display mt-1 block text-2xl font-semibold">{step.label}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{step.note}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-[520px] text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
              Urgency is printed in ink, not alarm colors. The nearer a deadline,
              the darker its shade. Past due is solid ink, impossible to miss
              and impossible to misread.
            </p>
          </div>
        </section>

        {/* ── What enters this ledger ──────────────────────────────────── */}
        <section aria-labelledby="track-title" className="border-t border-rule">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_1.4fr]">
            <Reveal>
              <h2 id="track-title" className="font-display max-w-[380px] text-3xl leading-[1.1] font-semibold tracking-[-0.01em] text-balance">
                If it expires, renews, or comes due, it has a line
              </h2>
              <p className="mt-4 max-w-[420px] text-base leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
                First salaries arrive with obligations attached. Insurance,
                domains, documents, the quiet subscriptions: they all enter the
                same ledger, wear the same shades, answer the same glance.
              </p>
            </Reveal>
            <Reveal delayMs={100}>
              <ul className="divide-y divide-rule border-y border-ink">
                {TRACKABLE.map((t, i) => (
                  <li key={t} className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-3 bg-bg py-3">
                    <span className="ledger-cap tabular text-[10px] text-ink-muted" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium">{t}</span>
                    <span aria-hidden className="ml-3 hidden h-2 w-16 sm:block" style={{ backgroundColor: `var(--urgency-${["calm", "soon", "urgent", "critical", "overdue"][i % 5]})` }} />
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="faq-title" className="border-t border-rule">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <Reveal as="h2" id="faq-title" className="ledger-cap text-[11px] text-ink-muted">
              Questions people ask
            </Reveal>
            <Reveal className="mt-8 divide-y divide-rule border-y border-rule">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden
                      className="text-ink-muted transition-transform duration-200 ease-[var(--ease-out-expo)] group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-rule">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <Reveal>
              <h2 className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.015em] text-balance md:text-5xl">
                Stop paying for things you forgot about
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-base leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
                Open your ledger in ten minutes. Sleep better tonight.
              </p>
              <Link
                href="/signup"
                className="plate mt-8 inline-flex h-11 items-center rounded-[var(--radius-control)] px-6 text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Open your free ledger
              </Link>
              <p className="mt-4 text-xs tracking-wide text-ink-muted">
                Free during early access · Cancel anytime
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} SirenDeck</p>
          <div className="flex items-center gap-5">
            <Link href="/login" className="transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Sign in</Link>
            <a href="mailto:hello@sirendeck.app" className="transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
