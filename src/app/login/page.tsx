"use client";

import { useEffect } from "react";

import { useBlocksAuth } from "@/components/blocks-auth-provider";

/**
 * No dedicated sign-in surface: this page immediately continues to the hosted
 * Blocks OIDC login. Unauthenticated /app traffic lands here and never sees a
 * form; /login/callback remains the OIDC return leg.
 */
export default function LoginPage() {
  const { configured, login } = useBlocksAuth();

  useEffect(() => {
    if (configured) {
      login("/app").catch(() => {
        /* startLogin navigates away on success; failures render the notice */
      });
    }
  }, [configured, login]);

  if (!configured) {
    return (
      <main id="main-content" className="flex min-h-dvh flex-col bg-bg text-ink">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6">
          <p role="alert" className="text-sm">
            Blocks login is not configured. Copy{" "}
            <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env.local</code> and fill the
            Blocks OS values.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center bg-bg text-ink-muted"
    >
      <p className="ledger-cap text-[11px]">Redirecting to sign-in…</p>
    </main>
  );
}
