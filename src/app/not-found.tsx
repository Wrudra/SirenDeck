import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-bg px-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <p className="text-sm font-medium text-ink-muted">404</p>
        <h1 className="text-4xl font-semibold tracking-[-0.03em]" style={{ textWrap: "balance" }}>
          This page is not here
        </h1>
        <p className="text-sm leading-relaxed text-ink-muted" style={{ textWrap: "pretty" }}>
          The address may be mistyped, or the page moved.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link
            href="/app"
            className="plate rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Open the map
          </Link>
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
