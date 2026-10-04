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
      {/* map skeleton · dark sector bars over dense heatmap tiles */}
      <div className="flex min-h-0 flex-1 flex-col gap-px bg-heat-bg p-px" aria-hidden>
        <div className="flex h-5 items-center justify-between bg-ink px-2">
          <span className="h-1.5 w-20 animate-pulse rounded-[1px] bg-heat-ink/30" />
          <span className="h-1.5 w-12 animate-pulse rounded-[1px] bg-heat-ink/20" />
        </div>
        <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-px">
          <div className="col-span-2 row-span-2 animate-pulse bg-heat-overdue" />
          <div className="col-span-2 animate-pulse bg-heat-calm" />
          <div className="animate-pulse bg-heat-soon" />
          <div className="animate-pulse bg-heat-critical" />
          <div className="col-span-2 animate-pulse bg-heat-calm" />
          <div className="animate-pulse bg-heat-soon" />
        </div>
      </div>
      {/* summary strip skeleton */}
      <div className="flex items-center gap-8 border-t border-rule bg-surface px-4 py-2.5">
        <div className="h-8 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="h-8 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="ml-auto h-8 w-12 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
      </div>
    </div>
  );
}
