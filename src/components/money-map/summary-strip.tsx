"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import type { MapModel } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";

/**
 * Flap figure: gentle count-up with tabular figures, like a split-flap
 * settling on its value. Reduced motion → instant value. The rAF callback
 * (an external-system subscription) is the only place state advances.
 */
function CountUp({
  value,
  format,
}: {
  value: number;
  format: (v: number) => string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const startRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      startRef.current = value;
      return;
    }

    const start = startRef.current;
    const delta = value - start;
    if (delta === 0) return;

    const t0 = performance.now();
    const duration = 600;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = start + delta * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, reduced]);

  const shown = reduced ? value : display;

  return (
    <span className="tabular" style={{ fontFamily: "var(--font-mono-var)" }}>
      {format(Math.round(shown))}
    </span>
  );
}

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
    <div className="flex min-w-28 flex-col gap-0.5">
      <span className="ledger-cap text-[10px] text-ink-muted">{label}</span>
      <span
        className={
          emphasis === "overdue"
            ? "text-sm font-semibold text-urgency-overdue-text"
            : emphasis === "dueSoon"
              ? "text-sm font-semibold text-urgency-urgent-text"
              : "font-display text-base font-semibold"
        }
      >
        <CountUp value={value} format={format} />
      </span>
    </div>
  );
}

/**
 * Summary strip: per-currency blocks (total yearly / next 30 days / overdue),
 * plus item count. Reads as the board's totals row.
 */
export function SummaryStrip({ model }: { model: MapModel }) {
  return (
    <div
      role="status"
      aria-label="Cost summary"
      className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-rule bg-surface px-4 py-2.5"
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
            format={(v) => formatCost(v, currency) ?? "—"}
          />
          <SummaryMetric
            label="Next 30d"
            value={line.dueIn30}
            format={(v) => formatCost(v, currency) ?? ""}
            emphasis={line.dueIn30 > 0 ? "dueSoon" : undefined}
          />
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
