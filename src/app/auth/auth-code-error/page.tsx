import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Sign-in link expired",
};

export default function AuthCodeErrorPage() {
  return (
    <main id="main-content" className="flex min-h-svh flex-col justify-center bg-bg px-6 text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Link
          href="/"
          className="w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Logo className="h-8" />
        </Link>
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">That link has expired</h1>
        <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          Confirmation links are single use and time limited. Sign in again and we can send a fresh one.
        </p>
        <Link
          href="/login"
          className="plate mt-2 inline-flex h-11 w-fit items-center rounded-full px-5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
