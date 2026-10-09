import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-bg px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="ledger-cap tabular text-[11px] text-ink-muted">404</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.01em]" style={{ textWrap: "balance" }}>
          This page is not in the ledger
        </h1>
        <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          The address may be mistyped, or the page moved. Your ledger is one click away.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link
            href="/app"
            className="plate rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open your ledger
          </Link>
          <Link
            href="/"
            className="rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
