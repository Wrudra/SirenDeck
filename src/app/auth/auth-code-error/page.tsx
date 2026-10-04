import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign-in link expired",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span aria-hidden className="flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-ink text-bg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-5">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">That link has expired</h1>
        <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          Confirmation links are single use and time limited. Sign in again and we can send a fresh one.
        </p>
        <Link
          href="/login"
          className="plate mt-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
