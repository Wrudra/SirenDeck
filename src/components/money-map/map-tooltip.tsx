"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckIcon, PencilIcon } from "lucide-react";

import { cn } from "cn";
import type { CategoryRow } from "@/lib/validation/item";
import type { MapItem } from "@/lib/map/map-model";
import { formatCost } from "@/lib/money";
import { daysLabel, URGENCY_FILL } from "./tile";

const CARD_W = 248;
const CARD_H = 118;
const GAP = 10;
const EASE = [0.23, 1, 0.32, 1] as const;

export type TileBox = { x: number; y: number; w: number; h: number };

/** One tile fills the map, so the card sits centered on the top edge and stays put. */
export function placeTopCenter(bounds: { w: number; h: number }): { x: number; y: number } {
  return {
    x: Math.max(8, (bounds.w - CARD_W) / 2),
    y: Math.min(40, Math.max(8, bounds.h - CARD_H - 8)),
  };
}

/** Place the card on the side of the tile that has room, then clamp it inside the map. */
export function placeBeside(
  tile: TileBox,
  bounds: { w: number; h: number },
): { x: number; y: number } {
  let x = tile.x + tile.w + GAP;
  let y = tile.y + tile.h / 2 - CARD_H / 2;
  if (x + CARD_W > bounds.w - 8) x = tile.x - CARD_W - GAP;
  if (x < 8) {
    x = Math.min(Math.max(8, tile.x), Math.max(8, bounds.w - CARD_W - 8));
    y = tile.y + tile.h + GAP;
    if (y + CARD_H > bounds.h - 8) y = tile.y - CARD_H - GAP;
  }
  y = Math.min(Math.max(8, y), Math.max(8, bounds.h - CARD_H - 8));
  x = Math.min(Math.max(8, x), Math.max(8, bounds.w - CARD_W - 8));
  return { x, y };
}

/**
 * Detail card. Beside the tile under the pointer, unless this is the only
 * item: then it stays centered at the top. The map does not resize.
 */
export function MapTooltip({
  item,
  category,
  anchor,
  bounds,
  pinned = false,
  onDone,
  onEdit,
  donePending,
  onHold,
}: {
  item: MapItem | null;
  category: CategoryRow | undefined;
  anchor: TileBox | null;
  bounds: { w: number; h: number } | null;
  /** Keep the card at the top center. Used when the map has a single item. */
  pinned?: boolean;
  onDone?: () => void;
  onEdit?: () => void;
  donePending?: boolean;
  onHold?: (id: string | null) => void;
}) {
  const reduced = useReducedMotion();
  const open = Boolean(item && bounds && bounds.w > 0 && (pinned || anchor));
  const pos = !open || !bounds
    ? { x: 0, y: 0 }
    : pinned
      ? placeTopCenter(bounds)
      : anchor
        ? placeBeside(anchor, bounds)
        : { x: 0, y: 0 };
  const fill = item ? URGENCY_FILL[item.urgency] : "";
  const move = reduced ? { duration: 0 } : { duration: 0.14, ease: EASE };

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          key="map-detail"
          role="status"
          aria-live="polite"
          data-map-detail
          onMouseEnter={() => onHold?.(item.id)}
          onMouseLeave={() => onHold?.(null)}
          initial={reduced ? false : { opacity: 0, x: pos.x, y: pos.y }}
          animate={{ opacity: 1, x: pos.x, y: pos.y }}
          exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.1, ease: EASE } }}
          transition={{ opacity: { duration: reduced ? 0 : 0.12, ease: EASE }, x: move, y: move }}
          className="pointer-events-auto absolute top-0 left-0 z-30 w-[248px] rounded-2xl bg-white p-3 text-ink shadow-[0_12px_32px_rgb(0_0_0/0.18)]"
        >
          <div className="flex items-start gap-2.5">
            <span aria-hidden className={cn("mt-1 size-2 shrink-0 rounded-full", fill)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-[-0.01em]">{item.title}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {category?.name ?? "Uncategorized"}
                {" · "}
                {daysLabel(item.daysLeft)}
              </p>
            </div>
          </div>
          <p
            className="mt-2 text-sm font-medium tabular"
            style={{ fontFamily: "var(--font-mono-var)" }}
          >
            {item.amount != null && item.amount > 0
              ? formatCost(item.amount, item.currency)
              : "No amount"}
            <span className="ml-2 font-normal text-ink-muted">{item.dueDate}</span>
          </p>
          <div className="mt-3 flex items-center gap-2">
            {onDone && (
              <button
                type="button"
                onClick={onDone}
                disabled={donePending}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-medium text-bg transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] hover:bg-ink/90 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <CheckIcon className="size-3.5" aria-hidden />
                {donePending ? "Saving" : "Done"}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-surface-2 px-3 text-xs font-medium text-ink transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] hover:bg-surface-2/80 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <PencilIcon className="size-3.5" aria-hidden />
                Edit
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
