/**
 * Map key. Sits on the canvas as a short caption, not a footer bar.
 * Size encodes how soon a deadline is; color encodes how urgent it is.
 */
export function MapLegend() {
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-20 hidden max-w-56 rounded-2xl bg-surface/95 px-3 py-2 text-[11px] leading-snug text-ink shadow-[0_8px_24px_rgb(0_0_0/0.12)] sm:block">
      <p>Larger means sooner.</p>
      <p className="mt-1 flex items-center gap-2 text-ink-muted">
        <span
          aria-hidden
          className="h-1.5 w-16 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--heat-calm), var(--heat-soon), var(--heat-watch), var(--heat-overdue))",
          }}
        />
        Color is how urgent.
      </p>
    </div>
  );
}
