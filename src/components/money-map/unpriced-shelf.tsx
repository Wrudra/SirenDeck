"use client";

import { motion } from "motion/react";
import { PlusIcon } from "lucide-react";

import type { MapItem } from "@/lib/map/map-model";
import { daysLabel } from "./tile";

/** Chip fill token for an urgency level's border-left color. */
function urgencyVar(urgency: MapItem["urgency"]): string {
  return `var(--urgency-${urgency})`;
}

/**
 * Unpriced shelf: chips with urgency-colored border-left, "Add cost" action.
 */
export function UnpricedShelf({
  items,
  onAddCost,
}: {
  items: MapItem[];
  onAddCost: (itemId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="Unpriced items"
      className="border-t border-border-subtle bg-surface px-4 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-muted">Unpriced</span>
        {items.map((item) => (
          <motion.span
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="inline-flex max-w-64 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 py-1 pl-2.5 pr-1.5 text-xs"
            style={{ borderLeft: `3px solid ${urgencyVar(item.urgency)}` }}
          >
            <span className="truncate">{item.title}</span>
            <span className="shrink-0 text-ink-muted">{daysLabel(item.daysLeft)}</span>
            <button
              type="button"
              onClick={() => onAddCost(item.id)}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-accent hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={`Add cost to ${item.title}`}
            >
              <PlusIcon className="size-3" aria-hidden />
            </button>
          </motion.span>
        ))}
      </div>
    </section>
  );
}
