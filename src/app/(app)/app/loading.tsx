export default function AppLoading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-label="Loading your map">
      {/* filter bar skeleton */}
      <div className="flex h-10 items-center gap-2 border-b border-border-subtle bg-surface px-4">
        <div className="h-7 w-44 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="h-7 w-28 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="h-7 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
      </div>
      {/* header row skeleton */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <div className="flex gap-1">
          <div className="h-7 w-16 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
          <div className="h-7 w-14 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
      </div>
      {/* map skeleton — a few large blocks fading */}
      <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-3 gap-1 p-1" aria-hidden>
        <div className="col-span-2 row-span-2 animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
        <div className="col-span-2 animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
        <div className="animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
        <div className="animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
        <div className="col-span-2 animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
        <div className="animate-pulse rounded-[var(--radius-tile)] bg-surface-2" />
      </div>
      {/* summary strip skeleton */}
      <div className="flex items-center gap-8 border-t border-border-subtle bg-surface px-4 py-2.5">
        <div className="h-8 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="h-8 w-24 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
        <div className="ml-auto h-8 w-12 animate-pulse rounded-[var(--radius-control)] bg-surface-2" />
      </div>
    </div>
  );
}
