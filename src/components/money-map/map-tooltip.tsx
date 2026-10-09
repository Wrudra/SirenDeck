"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CheckIcon, PencilIcon } from "lucide-react";

import type { CategoryRow } from "@/lib/validation/item";
import type { MapItem } from "@/lib/map/map-model";
import { daysLabel, URGENCY_FILL } from "./tile";

/**
 * Selection card. It floats over the map and only exists once a tile is
 * chosen, so the treemap never resizes to make room for it.
 */
export function MapTooltip({
  item,
  category,
  onDone,
  donePending,
}: {
  item: MapItem | null;
  category: CategoryRow | undefined;
  onDone?: () => void;
  donePending?: boolean;
}) {
  const reduced = useReducedMotion();
  if (!item) return null;

  const fill = URGENCY_FILL[item.urgency];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-3 left-3 z-30 w-[min(22rem,calc(100%-1.5rem))]"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        className="pointer-events-auto rounded-2xl bg-surface p-3 text-ink shadow-[0_12px_40px_rgb(0_0_0/0.18)]"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1 size-2.5 shrink-0 rounded-full"
            style={{ background: fill }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-[-0.01em]">
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {category?.name ?? "Uncategorized"}
              {" · "}
              {item.dueDate}
              {" · "}
              {daysLabel(item.daysLeft)}
            </p>
          </div>
          <p
            className="shrink-0 text-sm font-medium tabular"
            style={{ fontFamily: "var(--font-mono-var)" }}
          >
            {item.yearCost != null && item.yearCost > 0
              ? `${item.currency} ${item.yearCost.toLocaleString("en-US")}`
              : "No amount"}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              disabled={donePending}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-medium text-bg transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] hover:bg-ink/90 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
            >
              <CheckIcon className="size-3.5" aria-hidden />
              {donePending ? "Saving" : "Done"}
            </button>
          )}
          <Link
            href={`/app?edit=${item.id}`}
            scroll={false}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-medium text-ink transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] hover:bg-surface-2/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <PencilIcon className="size-3.5" aria-hidden />
            Edit
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
