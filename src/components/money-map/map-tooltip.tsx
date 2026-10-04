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
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.id}
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-black px-4 py-2 text-white shadow-lg"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="text-[11px] text-white/60">{category?.name ?? "Uncategorized"}</p>
          </div>
          <div className="text-right">
            <p className="tabular text-sm" style={{ fontFamily: "var(--font-mono-var)" }}>
              {yearCost ?? "·"}
            </p>
            <p className="text-[10px] tracking-[0.08em] text-white/55">YEARLY</p>
          </div>
          <div className="text-right">
            <p className="tabular text-sm" style={{ fontFamily: "var(--font-mono-var)" }}>
              {charge ?? "·"}
            </p>
            <p className="text-[10px] tracking-[0.08em] text-white/55">{PERIOD[item.recurrence]}</p>
          </div>
          <div className="text-right">
            <p className="tabular text-sm" style={{ fontFamily: "var(--font-mono-var)" }}>
              {daysLabel(item.daysLeft)}
            </p>
            <p className="text-[10px] tracking-[0.08em] text-white/55">DUE</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
