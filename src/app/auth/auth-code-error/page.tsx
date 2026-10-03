import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign-in link expired",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0e14] px-6 text-[#e8ecf4]">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span aria-hidden className="inline-block size-10 rounded-xl border border-[#dc2626]/40 bg-[#dc2626]/10 p-2.5 text-[#f87171]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-full">
            <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">That link has expired</h1>
        <p className="text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>
          Confirmation links are single use and time limited. Sign in again and we can send a fresh one.
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-xl bg-[#4cc2ff] px-4 py-2 text-sm font-semibold text-[#0a0e14] transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
