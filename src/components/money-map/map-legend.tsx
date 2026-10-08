/**
 * Quiet map key: tile area is how soon the deadline is, color is the same ramp.
 * Lives beside the detail bar (inside MoneyMap) so it never covers tiles
 * and never appears on ledger-only / mobile list when the map is hidden.
 */

const RAMP = [
  "bg-heat-calm",
  "bg-heat-soon",
  "bg-heat-urgent",
  "bg-heat-critical",
  "bg-heat-overdue",
] as const;

export function MapLegend() {
  return (
    <div
      role="note"
      aria-label="Map key: larger tiles are closer to their deadline, overdue largest; color runs calm to overdue"
      className="ml-auto hidden shrink-0 items-center gap-2.5 border-l border-white/15 pl-3 sm:flex"
    >
      <span className="flex items-end gap-px" aria-hidden>
        <span className="block h-1.5 w-1.5 bg-white/35" />
        <span className="block h-2.5 w-2.5 bg-white/55" />
      </span>
      <span className="ledger-cap text-[9px] tracking-[0.12em] text-white/45">
        Area · due soon
      </span>
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      <span className="flex h-1.5 overflow-hidden rounded-[1px]" aria-hidden>
        {RAMP.map((c) => (
          <span key={c} className={`h-full w-2 ${c}`} />
        ))}
      </span>
      <span className="ledger-cap text-[9px] tracking-[0.12em] text-white/45">
        Color · due
      </span>
    </div>
  );
}
