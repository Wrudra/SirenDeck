"use client";

import { useEffect } from "react";

import { useBlocksAuth } from "@/components/blocks-auth-provider";
import { BlocksTopBar } from "@/components/shell/blocks-top-bar";
import { Toaster } from "@/components/ui/sonner";

function claimEmail(claims: Record<string, unknown> | null): string {
  if (!claims) return "account";
  const email = claims.email ?? claims.preferred_username ?? claims.sub;
  return typeof email === "string" && email ? email : "account";
}

/**
 * Client gate for Blocks-authenticated app routes.
 * Supabase requireUser() cannot see the Blocks session cookie, so when
 * NEXT_PUBLIC_AUTH_PROVIDER=blocks we render this shell instead of the server layout gate.
 */
export function BlocksAppShell({ children }: { children: React.ReactNode }) {
  const { status, claims } = useBlocksAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas text-ink-muted">
        <p className="ledger-cap text-[11px]">Loading session…</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas text-ink-muted">
        <p className="ledger-cap text-[11px]">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <BlocksTopBar email={claimEmail(claims)} />
      <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
