export default function AppLoading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-label="Opening the ledger">
      {/* filter bar skeleton */}
      <div className="flex h-10 items-center gap-2 border-b border-rule bg-surface px-4">
        <div className="h-7 w-44 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="h-7 w-28 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="h-7 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
      </div>
      {/* header row skeleton */}
      <div className="flex items-center justify-between border-b border-rule bg-surface px-4 py-2">
        <div className="flex gap-4">
          <div className="h-8 w-14 animate-pulse border-b-2 border-rule-strong" />
          <div className="h-8 w-16 animate-pulse border-b-2 border-rule" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
      </div>
      {/* Neutral content skeleton · works for both map and ledger (no view flash). */}
      <div className="flex min-h-0 flex-1 flex-col bg-bg px-4 py-4" aria-hidden>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-0">
          <div className="mb-2 h-3 w-full animate-pulse border-b border-rule" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-rule py-3"
            >
              <div className="h-5 w-6 animate-pulse rounded-[2px] bg-surface-2" />
              <div className="h-2.5 w-2.5 shrink-0 animate-pulse bg-surface-2" />
              <div className="h-4 flex-1 animate-pulse rounded-[2px] bg-surface-2" />
              <div className="h-4 w-20 animate-pulse rounded-[2px] bg-surface-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
