"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-bg px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="ledger-cap text-[11px] font-semibold">Ledger fault</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]">Something broke on our side</h1>
        <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          The error was logged. Try again, and if it keeps happening, write to hello@sirendeck.app.
        </p>
        <button
          type="button"
          onClick={reset}
          className="plate mt-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
