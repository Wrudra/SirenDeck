import type { MapModel } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";

/**
 * Compact stats sitting above the map. Figures stay still — they are data.
 */
export function SummaryStrip({ model }: { model: MapModel }) {
  return (
    <div
      role="status"
      aria-label="Cost summary"
      className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-2"
    >
      {model.totals.length === 0 && (
        <p className="text-xs text-ink-muted">No priced items yet.</p>
      )}
      {model.totals.map(({ currency, line }) => (
        <div key={currency} className="flex items-center gap-2">
          <Stat label="This year" value={formatCost(line.totalYearly, currency) ?? "·"} />
          <Stat
            label="Next 30 days"
            value={formatCost(line.dueIn30, currency) ?? "·"}
            tone={line.dueIn30 > 0 ? "soon" : undefined}
          />
          <Stat
            label="Overdue"
            value={formatCost(line.overdue, currency) ?? "·"}
            tone={line.overdue > 0 ? "overdue" : undefined}
          />
        </div>
      ))}
      <Stat label="Items" value={String(model.itemCount)} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "soon" | "overdue";
}) {
  return (
    <div className="flex shrink-0 items-baseline gap-2 rounded-full bg-surface px-3 py-1.5 text-xs shadow-[0_1px_0_rgb(0_0_0/0.04)]">
      <span className="text-ink-muted">{label}</span>
      <span
        className={
          tone === "overdue"
            ? "font-medium tabular text-urgency-overdue-text"
            : tone === "soon"
              ? "font-medium tabular text-urgency-urgent-text"
              : "font-medium tabular text-ink"
        }
        style={{ fontFamily: "var(--font-mono-var)" }}
      >
        {value}
      </span>
    </div>
  );
}
