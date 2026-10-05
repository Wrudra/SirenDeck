"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { MapItem } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";
import type { CategoryRow } from "@/lib/validation/item";
import type { Recurrence } from "@/lib/money";
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
 */
export function MapTooltip({
  item,
  category,
}: {
  item: MapItem | null;
  category?: CategoryRow;
}) {
  const reduced = useReducedMotion();
  const yearCost = item ? formatCost(item.yearCost, item.currency) : null;
  const charge = item ? formatCost(item.amount, item.currency) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="relative flex h-16 shrink-0 items-center border-t border-black bg-black px-4 text-white"
    >
      <AnimatePresence mode="wait" initial={false}>
        {item ? (
          <motion.div
            key={item.id}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex min-w-0 flex-1 items-center gap-4"
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
            <div className="shrink-0 text-right">
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
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-white/40"
          >
            Hover or select a tile
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
