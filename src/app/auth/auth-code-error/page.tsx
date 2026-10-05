import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign-in link expired",
};

export default function AuthCodeErrorPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col bg-bg text-ink"
    >
      <header className="border-b border-rule">
        <div className="mx-auto flex h-14 max-w-sm items-center px-6">
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
        <div className="rounded-[var(--radius-dialog)] border border-rule bg-surface p-5 text-center sm:p-6">
          <p className="ledger-cap text-[10px] text-ink-muted">Link expired</p>
          <h1 className="font-display mt-3 text-2xl font-semibold tracking-[-0.01em]">
            That link has expired
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed text-ink-muted"
            style={{ textWrap: "pretty" }}
          >
            Confirmation links are single use and time limited. Sign in again and
            we can send a fresh one.
          </p>
          <Link
            href="/login"
            className="plate mt-5 inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] px-5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
