"use client";

import { motion } from "motion/react";
import { PlusIcon } from "lucide-react";

import type { MapItem } from "@/lib/map/map-model";
import { daysLabel } from "./tile";

/** Enamel dot token for an urgency level. */
function urgencyVar(urgency: MapItem["urgency"]): string {
  return `var(--urgency-${urgency})`;
}

/**
 * Unpriced shelf: waiting-room chips with urgency dots, "Add cost" action.
 * These items have no area yet · they wait at the bottom of the board until
 * priced.
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
      className="border-t border-rule bg-surface px-4 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="ledger-cap mr-1 text-[10px] text-ink-muted">Unpriced</span>
        {items.map((item) => (
          <motion.span
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="inline-flex max-w-64 items-center gap-2 rounded-[var(--radius-control)] border border-rule bg-surface-2 py-1 pl-2.5 pr-1.5 text-xs"
          >
            <span
              aria-hidden
              className="size-2 shrink-0 border border-ink/20"
              style={{ backgroundColor: urgencyVar(item.urgency) }}
            />
            <span className="truncate">{item.title}</span>
            <span className="tabular shrink-0 text-ink-muted">{daysLabel(item.daysLeft)}</span>
            <button
              type="button"
              onClick={() => onAddCost(item.id)}
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
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
