import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0a0e14] px-6 text-[#e8ecf4]">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <p className="font-mono text-xs tracking-widest text-[#8b94a7]">404</p>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ textWrap: "balance" }}>
          This page is not on the map
        </h1>
        <p className="text-sm leading-relaxed text-[#8b94a7]" style={{ textWrap: "pretty" }}>
          The address may be mistyped, or the page moved. Your Money Map is one click away.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link
            href="/app"
            className="rounded-xl bg-[#4cc2ff] px-4 py-2 text-sm font-semibold text-[#0a0e14] transition-transform duration-300 ease-[var(--ease-fluid)] hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
          >
            Open your map
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold transition-colors hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4cc2ff]"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
