"use client";

import { useState } from "react";

import { useBlocksAuth } from "@/components/blocks-auth-provider";

export function BlocksLoginButton({ returnTo = "/app" }: { returnTo?: string }) {
  const { configured, login, status } = useBlocksAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return (
      <div
        role="status"
        className="rounded-[var(--radius-control)] border border-rule bg-surface-2 px-3 py-2 text-xs text-ink-muted"
      >
        Blocks login is not configured. Set{" "}
        <code className="font-mono text-[11px]">NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID</code> (and related
        vars) in <code className="font-mono text-[11px]">.env.local</code>. Register callback{" "}
        <code className="font-mono text-[11px]">{origin}/login/callback</code>.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        disabled={pending || status === "loading"}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await login(returnTo);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not start login.");
            setPending(false);
          }
        }}
        className="plate h-11 w-full rounded-[var(--radius-control)] text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Redirecting…" : "Continue with Blocks"}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-ink">
          {error}
        </p>
      ) : (
        <p className="text-xs text-ink-muted">
          Hosted email + password login. Requires HTTPS on the project domain for the session cookie
          to stick (plain localhost will redirect but not stay signed in).
        </p>
      )}
    </div>
  );
}
