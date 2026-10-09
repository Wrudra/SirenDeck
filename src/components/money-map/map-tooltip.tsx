"use client";

import { CheckIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { MapItem } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";
import type { CategoryRow } from "@/lib/validation/item";
import type { Recurrence } from "@/lib/money";
import { MapLegend } from "./map-legend";
import { daysLabel } from "./tile";

const PERIOD: Record<Recurrence, string> = {
  none: "ONE-OFF",
  weekly: "PER WEEK",
  monthly: "PER MONTH",
  quarterly: "PER QUARTER",
  yearly: "PER YEAR",
};

/**
 * Detail strip under the map board (not an overlay).
 * Reserved ~64px height so the treemap ResizeObserver never reflows on
 * hover/selection — avoids the old "empty bottom inset" and layout jump.
 * Quiet size/color legend sits beside the live detail (outside aria-live).
 */
export function MapTooltip({
  item,
  category,
  onEdit,
  onDone,
  donePending,
}: {
  item: MapItem | null;
  category?: CategoryRow;
  onEdit?: () => void;
  onDone?: () => void;
  donePending?: boolean;
}) {
  const reduced = useReducedMotion();
  const yearCost = item ? formatCost(item.yearCost, item.currency) : null;
  const charge = item ? formatCost(item.amount, item.currency) : null;

  return (
    <div className="relative flex min-h-16 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-black bg-black px-3 py-2 text-white sm:h-16 sm:flex-nowrap sm:px-4 sm:py-0">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="flex min-w-0 flex-1 items-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {item ? (
            <motion.div
              key={item.id}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-[11px] text-white/60">
                  {category?.name ?? "Uncategorized"}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular text-sm" style={{ fontFamily: "var(--font-mono-var)" }}>
                  {yearCost ?? "·"}
                </p>
                <p className="text-[10px] tracking-[0.08em] text-white/55">YEARLY</p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="tabular text-sm" style={{ fontFamily: "var(--font-mono-var)" }}>
                  {charge ?? "·"}
                </p>
                <p className="text-[10px] tracking-[0.08em] text-white/55">
                  {PERIOD[item.recurrence]}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular text-sm" style={{ fontFamily: "var(--font-mono-var)" }}>
                  {daysLabel(item.daysLeft)}
                </p>
                <p className="text-[10px] tracking-[0.08em] text-white/55">DUE</p>
              </div>
              {onDone && (
                <button
                  type="button"
                  onClick={onDone}
                  disabled={donePending}
                  aria-label={
                    item.autoRenews && item.recurrence !== "none"
                      ? `Mark ${item.title} done and start the next cycle`
                      : `Mark ${item.title} done`
                  }
                  className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-control)] border border-white/25 px-2.5 py-1.5 text-xs font-medium text-white hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
                >
                  <CheckIcon aria-hidden className="size-3.5" />
                  Done
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="shrink-0 rounded-[var(--radius-control)] border border-white/25 px-2.5 py-1.5 text-xs font-medium text-white hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  Edit
                </button>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="min-w-0 flex-1 text-sm text-white/40"
            >
              Hover or select a tile
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <MapLegend />
    </div>
  );
}
