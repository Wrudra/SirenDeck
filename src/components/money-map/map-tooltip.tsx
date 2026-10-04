"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "cn";
import type { MapItem } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";
import type { CategoryRow } from "@/lib/validation/item";
import { daysLabel } from "./tile";

export interface TooltipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function MapTooltip({
  item,
  rect,
  category,
  canvasWidth,
}: {
  item: MapItem | null;
  rect: TooltipRect | null;
  category?: CategoryRow;
  canvasWidth: number;
}) {
  const reduced = useReducedMotion();
  if (!item || !rect) return null;

  const width = 240;
  const flipX = rect.x + rect.width / 2 + width / 2 > canvasWidth - 8;
  const left = flipX
    ? Math.max(8, rect.x + rect.width / 2 - width)
    : rect.x + rect.width / 2;
  const top = rect.y + rect.height + 8;
  const yearCost = formatCost(item.yearCost, item.currency);

  return (
    <AnimatePresence>
      <motion.div
        key={item.id}
        initial={reduced ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "pointer-events-none absolute z-30 w-60 rounded-[var(--radius-control)] border border-ink bg-surface p-3",
          "shadow-[0_8px_24px_rgb(20_19_17/0.16),0_2px_8px_rgb(20_19_17/0.10)]",
        )}
        style={{ left, top, width }}
      >
        <p className="text-sm font-medium">{item.title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{category?.name ?? "Uncategorized"}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-ink-muted">Yearly</dt>
          <dd className="tabular text-right" style={{ fontFamily: "var(--font-mono-var)" }}>
            {yearCost ?? "—"}
          </dd>
          <dt className="text-ink-muted">Due</dt>
          <dd className="tabular text-right" style={{ fontFamily: "var(--font-mono-var)" }}>
            {item.dueDate}
          </dd>
          <dt className="text-ink-muted">Urgency</dt>
          <dd className="text-right">{daysLabel(item.daysLeft)}</dd>
          <dt className="text-ink-muted">Renews</dt>
          <dd className="text-right">{item.autoRenews ? "Auto" : "Manual"}</dd>
        </dl>
      </motion.div>
    </AnimatePresence>
  );
}
