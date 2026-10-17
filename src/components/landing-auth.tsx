"use client";

import { useState } from "react";

import { startLogin, startSignup } from "@/lib/blocks/auth";
import { isBlocksLoginConfigured } from "@/lib/blocks/config";

/**
 * Header auth cluster for the landing page: quiet sign-in text plus the
 * filled sign-up plate. Lives in the sticky header, so the action stays
 * available while the visitor scrolls the sample map.
 */
export function LandingAuth() {
  const configured = isBlocksLoginConfigured();
  const [pending, setPending] = useState<"login" | "signup" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(flow: "login" | "signup") {
    setPending(flow);
    setError(null);
    try {
      if (flow === "signup") {
        await startSignup("/app");
      } else {
        await startLogin("/app");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start sign-in.");
      setPending(null);
    }
  }

  if (!configured) {
    return <p className="text-xs text-ink-muted">Login not configured</p>;
  }

  return (
    <div className="relative flex items-center gap-5">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => go("login")}
        className="-my-2 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
      >
        {pending === "login" ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => go("signup")}
        className="plate inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pending === "signup" ? "Opening…" : "Sign up"}
      </button>
      {error ? (
        <p
          role="alert"
          className="absolute top-full right-0 mt-2 max-w-xs text-right text-xs text-ink"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
