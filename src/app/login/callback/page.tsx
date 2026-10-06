"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useBlocksAuth } from "@/components/blocks-auth-provider";
import { completeLogin } from "@/lib/blocks/auth";

/**
 * OIDC callback — must NOT be wrapped in an auth gate.
 * Completes hosted login then navigates to the stashed returnTo.
 */
export default function LoginCallbackPage() {
  const router = useRouter();
  const { refresh } = useBlocksAuth();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      const result = await completeLogin(window.location.href);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      await refresh();
      router.replace(result.returnTo);
    })();
  }, [refresh, router]);

  if (error) {
    return (
      <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-ink">
        <p className="ledger-cap text-[10px] text-ink-muted">Sign-in failed</p>
        <p role="alert" className="max-w-sm text-center text-sm text-ink">
          {error}
        </p>
        <Link
          href="/login"
          className="text-sm font-medium underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
        >
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center bg-bg text-ink">
      <p className="ledger-cap text-[10px] text-ink-muted">Completing sign-in…</p>
    </main>
  );
}
