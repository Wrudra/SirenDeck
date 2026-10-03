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
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0e14] px-6 text-[#e8ecf4]">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something broke on our side</h1>
        <p className="text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>
          The error was logged. Try again, and if it keeps happening, write to hello@sirendeck.app.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 rounded-xl bg-[#4cc2ff] px-4 py-2 text-sm font-semibold text-[#0a0e14] transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
