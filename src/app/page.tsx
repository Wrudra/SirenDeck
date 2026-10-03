import type { Metadata } from "next";
import Link from "next/link";

import { Reveal, TaglineReveal } from "@/components/marketing/reveal";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SirenDeck — see everything that renews, before it costs you",
  description:
    "One map of every subscription, bill, insurance, domain and document renewal. Sized by cost, colored by urgency. Know what is due and what it costs you, at a glance.",
};

const BENEFITS = [
  {
    title: "Catch renewals before they charge",
    body: "Deadlines turn red as they close in. The map screams quietly: what is overdue, what lands this week, what can wait.",
  },
  {
    title: "See cost, not just dates",
    body: "Every tile is sized by yearly cost, so the ৳14,400 a year of streaming shows up exactly as large as it deserves.",
  },
  {
    title: "Nothing slips through",
    body: "Passports, warranties, licenses, domains. If it expires or renews, it lives on the same map as your bills.",
  },
  {
    title: "Your numbers stay yours",
    body: "Private by default. Your data sits behind your own account, encrypted in transit, never sold or shared.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Add what renews",
    body: "Title, cost, due date, how often it repeats. Thirty seconds per item, and the defaults fit BDT first.",
  },
  {
    n: "02",
    title: "Read the map",
    body: "Tile size is yearly cost. Color is urgency: teal is calm, amber is closing in, red is overdue. One glance answers both questions.",
  },
  {
    n: "03",
    title: "Act and move on",
    body: "Click a tile to edit, snooze or mark done. Filters and search keep the view honest as the list grows.",
  },
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

  const primaryHref = "/signup";
  const primaryLabel = "Create your free map";

  return (
    <div className="min-h-dvh bg-[#0a0e14] text-[#e8ecf4]">
      {/* ── Nav (fluid island, quiet) ─────────────────────────────── */}
      <header className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <nav
          aria-label="Primary"
          className="flex w-max items-center gap-8 rounded-full border border-white/10 bg-[#0a0e14]/80 py-2 pl-6 pr-2 backdrop-blur-xl"
        >
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
            <span aria-hidden className="inline-block size-4 rounded-[5px] bg-[#dc2626]" />
            SirenDeck
          </Link>
          <div className="hidden items-center gap-6 text-sm text-[#8b94a7] sm:flex">
            <a className="transition-colors hover:text-[#e8ecf4]" href="#how">How it works</a>
            <a className="transition-colors hover:text-[#e8ecf4]" href="#faq">FAQ</a>
          </div>
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm text-[#8b94a7] transition-colors hover:text-[#e8ecf4]"
          >
            Sign in
          </Link>
          <Link
            href={primaryHref}
            className="rounded-full bg-[#4cc2ff] px-3 py-1.5 text-sm font-semibold text-[#0a0e14] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
          <Reveal as="p" className="mb-6 rounded-full border border-white/10 px-3 py-1 text-xs text-[#8b94a7]">
            Early access — free while we tune the sirens
          </Reveal>

          <Reveal delayMs={80}>
            <h1
              className="max-w-[680px] bg-clip-text text-5xl leading-tight font-semibold tracking-tight text-transparent md:text-6xl"
              style={{
                backgroundImage: "linear-gradient(to right, #ffffff, #9b9b9b)",
                textWrap: "balance",
              }}
            >
              <span className="block">Every renewal on one map,</span>
              <span className="block">before it costs you</span>
            </h1>
          </Reveal>

          <Reveal delayMs={160}>
            <p className="mt-6 max-w-[680px] text-lg leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>
              SirenDeck plots your subscriptions, bills, insurance, domains and documents as a live treemap.
              Tile size is what it costs you a year. Color is how soon it lands.
            </p>
          </Reveal>

          <Reveal delayMs={240} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href={primaryHref}
              className="text-base px-3 py-2 font-semibold rounded-xl bg-[#4cc2ff] text-[#0a0e14] transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 px-3 py-2 text-base font-semibold text-[#e8ecf4] transition-colors hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
            >
              I already have an account
            </Link>
          </Reveal>

          <Reveal delayMs={320} className="mt-8 text-xs text-[#8b94a7]">
            No card required · Data exportable anytime · BDT, USD and EUR
          </Reveal>

          {/* hero visual: a quiet, static miniature of the map */}
          <Reveal delayMs={400} className="mt-16 w-full">
            <div
              aria-hidden
              className="mx-auto grid aspect-[16/8] w-full max-w-4xl grid-cols-4 grid-rows-3 gap-1 overflow-hidden rounded-2xl border border-white/10 p-1"
            >
              {[
                "col-span-2 row-span-2 bg-[#d97706]",
                "bg-[#0f766e] col-span-2",
                "bg-[#65a30d]",
                "bg-[#ea580c]",
                "bg-[#0f766e]",
                "bg-[#dc2626]",
                "bg-[#0f766e] col-span-2",
              ].map((cls, i) => (
                <div key={i} className={`rounded-lg ${cls}`} />
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Tagline reveal (B11) ─────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <TaglineReveal
            className="text-4xl font-semibold tracking-tight md:text-5xl"
            lines={[
              "Renewals are not surprises.",
              "They are dates you forgot to fear.",
            ]}
          />
        </section>

        {/* ── Benefits ─────────────────────────────────────────────── */}
        <section aria-labelledby="benefits-title" className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal as="h2" id="benefits-title" className="text-3xl font-semibold tracking-tight">
            Why it sticks
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <Reveal
                as="li"
                key={b.title}
                delayMs={i * 80}
                className="rounded-2xl border border-white/10 bg-[#11161f] p-6"
              >
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>{b.body}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section id="how" aria-labelledby="how-title" className="mx-auto max-w-5xl px-6 pb-24">
          <Reveal as="h2" id="how-title" className="text-3xl font-semibold tracking-tight">
            How it works
          </Reveal>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delayMs={i * 100} className="rounded-2xl border border-white/10 bg-[#11161f] p-6">
                <span className="font-mono text-xs text-[#4cc2ff]">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl px-6 pb-24">
          <Reveal as="h2" id="faq-title" className="text-3xl font-semibold tracking-tight">
            Questions people ask
          </Reveal>
          <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#11161f] px-6">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden
                    className="text-[#8b94a7] transition-transform duration-300 ease-[var(--ease-fluid)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 pb-32 text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ textWrap: "balance" }}>
              Stop paying for things you forgot about
            </h2>
            <p className="mx-auto mt-4 max-w-[680px] text-base text-[#8b94a7]" style={{ textWrap: "pretty" }}>
              Build your map in ten minutes. Sleep better tonight.
            </p>
            <Link
              href={primaryHref}
              className="mt-8 inline-block rounded-xl bg-[#4cc2ff] px-6 py-3 text-base font-semibold text-[#0a0e14] transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
            >
              {primaryLabel}
            </Link>
            <p className="mt-4 text-xs text-[#8b94a7]">Free during early access · Cancel anytime</p>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-[#8b94a7] sm:flex-row">
          <p>© {new Date().getFullYear()} SirenDeck</p>
          <div className="flex items-center gap-5">
            <Link href="/login" className="transition-colors hover:text-[#e8ecf4]">Sign in</Link>
            <a href="mailto:hello@sirendeck.app" className="transition-colors hover:text-[#e8ecf4]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
