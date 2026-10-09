import type { MapModel } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";

function SummaryMetric({
  label,
  value,
  format,
  emphasis,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  emphasis?: "overdue" | "dueSoon";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 sm:min-w-28">
      <span className="ledger-cap text-[10px] text-ink-muted">{label}</span>
      <span
        className={
          emphasis === "overdue"
            ? "tabular text-sm font-semibold text-urgency-overdue-text"
            : emphasis === "dueSoon"
              ? "tabular text-sm font-semibold text-urgency-urgent-text"
              : "tabular font-display text-base font-semibold"
        }
        style={{ fontFamily: "var(--font-mono-var)" }}
      >
        {format(value)}
      </span>
    </div>
  );
}

/**
 * Summary strip: per-currency blocks (total yearly / next 30 days / overdue),
 * plus item count. Figures stay still — they are data being read.
 */
export function SummaryStrip({ model }: { model: MapModel }) {
  return (
    <div
      role="status"
      aria-label="Cost summary"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule bg-surface px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:gap-x-8 sm:gap-y-3 sm:px-4 sm:py-2.5"
    >
      {model.totals.length === 0 && (
        <p className="text-xs text-ink-muted">No priced items yet.</p>
      )}
      {model.totals.map(({ currency, line }) => (
        <div key={currency} className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="ledger-cap rounded-[var(--radius-control)] border border-rule px-2 py-0.5 text-[10px] text-ink-muted">
            {currency}
          </span>
          <SummaryMetric
            label="Yearly"
            value={line.totalYearly}
            format={(v) => formatCost(v, currency) ?? "·"}
          />
          <div className="hidden h-8 w-px bg-rule sm:block" aria-hidden />
          <SummaryMetric
            label="Next 30d"
            value={line.dueIn30}
            format={(v) => formatCost(v, currency) ?? ""}
            emphasis={line.dueIn30 > 0 ? "dueSoon" : undefined}
          />
          <div className="hidden h-8 w-px bg-rule sm:block" aria-hidden />
          <SummaryMetric
            label="Overdue"
            value={line.overdue}
            format={(v) => formatCost(v, currency) ?? ""}
            emphasis={line.overdue > 0 ? "overdue" : undefined}
          />
        </div>
      ))}
      <div className="ml-auto flex flex-col gap-0.5 text-right">
        <span className="ledger-cap text-[10px] text-ink-muted">Items</span>
        <span
          className="tabular text-sm font-semibold"
          style={{ fontFamily: "var(--font-mono-var)" }}
        >
          {model.itemCount}
        </span>
      </div>
    </div>
  );
}
