/**
 * Phase 5 will replace this placeholder with the real filter bar
 * (category, urgency, auto-renews, time window, search — in URL params).
 */
export function FilterBarPlaceholder() {
  return (
    <div
      role="region"
      aria-label="Filters (coming in Phase 5)"
      className="flex h-10 items-center gap-2 border-b border-border-subtle bg-surface px-4"
    >
      <span className="text-xs text-ink-muted">
        Filters arrive in Phase 5 — category · urgency · auto-renew · window · search
      </span>
    </div>
  );
}
