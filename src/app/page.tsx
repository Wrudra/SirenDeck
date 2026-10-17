import type { Metadata } from "next";
import Link from "next/link";

import { BuiltOnBlocks } from "@/components/brand/built-on-blocks";
import { Logo } from "@/components/brand/logo";
import { DepartureBoard } from "@/components/marketing/departure-board";
import { LandingAuth } from "@/components/landing-auth";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "SirenDeck: see everything that renews, before it costs you",
  description:
    "One map of every subscription, bill, insurance, domain, and document renewal. Closer deadlines grow larger. Color shows how urgent.",
};

export default function Home() {
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
          <LandingAuth />
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-20 md:pt-28">
          <Reveal>
            <h1 className="font-display max-w-[14ch] text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-balance">
              Every deadline, before it costs you
            </h1>
          </Reveal>
          <Reveal delay={0.06}>
            <p
              className="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-muted lg:max-w-md"
              style={{ textWrap: "pretty" }}
            >
              Subscriptions, bills, and documents on one map. A tile grows as the date gets closer. Green is calm, red is past due.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="mt-14">
              <DepartureBoard />
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-16">
              <BuiltOnBlocks />
            </div>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
