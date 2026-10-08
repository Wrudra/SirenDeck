"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import type { UrgencyLevel } from "@/lib/urgency";
import { formatDueDate } from "@/lib/map/cycle";
import { labelBudget, titleMonogram } from "@/lib/map/label-budget";

/** Muted heatmap fills. Dark text on all levels. */
export const URGENCY_FILL: Record<UrgencyLevel, string> = {
  calm: "bg-heat-calm text-heat-ink",
  soon: "bg-heat-soon text-heat-ink",
  urgent: "bg-heat-urgent text-heat-ink",
  critical: "bg-heat-critical text-heat-ink",
  overdue: "bg-heat-overdue text-heat-ink",
};

/** Print world: no pulse · solid ink is the alarm. Kept for API parity. */
export const URGENCY_PULSE: Record<UrgencyLevel, string> = {
  calm: "",
  soon: "",
  urgent: "",
  critical: "",
  overdue: "",
};

/** Spring for tile reflow · the authored rerank moment. */
export const SMOOTH_SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 1 } as const;

export function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `${daysLeft}d left`;
}

/** Map daysLeft to a compact TradingView-style "percent change" string. */
function daysTicker(daysLeft: number): string {
  if (daysLeft < 0) return `−${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return "0d";
  return `+${daysLeft}d`;
}

interface TileProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  dueDate: string;
  categoryId: string;
  categoryName?: string | null;
  cost: string | null;
  daysLeft: number;
  urgency: UrgencyLevel;
  icon: LucideIcon | null;
  /** the soonest due item on the board */
  isSoonest?: boolean;
  /** Snap the tile to the row edge while a narrow lane scrolls. */
  snap?: boolean;
  hot?: boolean;
  selected?: boolean;
  /** entrance stagger index (largest-first = 0); undefined = no entrance */
  index?: number;
  onHoverChange?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onFocusChange?: (id: string | null) => void;
}

function TileInner({
  id,
  x,
  y,
  width,
  height,
  title,
  dueDate,
  categoryId,
  categoryName,
  cost,
  daysLeft,
  urgency,
  icon: Icon,
  isSoonest,
  snap,
  hot,
  selected,
  index,
  onHoverChange,
  onSelect,
  onOpen,
  onFocusChange,
}: TileProps) {
  const reduced = useReducedMotion();
  const { showTitle, titleLines, showTicker, showDate, showCost, showIcon, showMonogram } = labelBudget(
    width,
    height,
    title,
    cost != null,
    Icon != null,
  );
  const showCategory = Boolean(categoryName) && showTitle && width >= 140 && height >= 112;
  const label = `${title}, ${daysLabel(daysLeft)}, due ${formatDueDate(dueDate)}${cost ? `, ${cost} per year` : ""}`;

  return (
    <motion.button
      type="button"
      layout={!reduced}
      layoutId={id}
      initial={index != null && !reduced ? { opacity: 0, scale: 0.92 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      transition={{
        ...SMOOTH_SPRING,
        ...(index != null && !reduced ? { delay: Math.min(index * 0.03, 0.6) } : {}),
      }}
      data-tile-id={id}
      data-category-id={categoryId}
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onOpen?.(id)}
      onHoverStart={() => onHoverChange?.(id)}
      onHoverEnd={() => onHoverChange?.(null)}
      onFocus={() => onFocusChange?.(id)}
      onBlur={() => onFocusChange?.(null)}
      aria-label={label}
      className={cn(
        "group absolute flex cursor-pointer flex-col items-center justify-center overflow-hidden border border-transparent p-1.5 text-center outline-none",
        snap && "snap-start",
        "focus-visible:ring-2 focus-visible:ring-heat-ink/70",
        "hover:z-20 focus-visible:z-20",
        (hot || selected) && "z-20 shadow-[inset_0_0_0_2px_#1c1917]",
        daysLeft <= 1 ? URGENCY_FILL.overdue : URGENCY_FILL[urgency],
        URGENCY_PULSE[urgency],
      )}
      style={{ left: x, top: y, width, height }}
    >
      <span className="pointer-events-none flex h-full w-full flex-col items-center justify-center gap-0.5 px-2 text-center">
        {showIcon && Icon != null && <Icon aria-hidden className="mb-0.5 size-4 opacity-80" />}
        {showCategory && (
          <span className="ledger-cap max-w-full truncate text-[10px] tracking-[0.08em] text-heat-ink-muted">
            {categoryName}
          </span>
        )}
        {showTitle && (
          <span
            className={cn(
              "text-base leading-tight font-bold tracking-[-0.02em]",
              titleLines === 1 ? "line-clamp-1" : "line-clamp-2",
            )}
          >
            {title}
          </span>
        )}
        {showMonogram && (
          <span className="text-base leading-none font-semibold tracking-[-0.01em] opacity-90">
            {titleMonogram(title)}
          </span>
        )}
        {showTicker && (
          <span className="tabular text-sm font-bold" style={{ fontFamily: "var(--font-mono-var)" }}>
            {daysTicker(daysLeft)}
          </span>
        )}
        {showDate && (
          <span className="tabular text-[11px] font-medium" style={{ fontFamily: "var(--font-mono-var)" }}>
            {formatDueDate(dueDate)}
          </span>
        )}
        {showCost && (
          <span className="tabular text-xs text-heat-ink-muted" style={{ fontFamily: "var(--font-mono-var)" }}>
            {cost}
          </span>
        )}
      </span>
    </motion.button>
  );
}

export const Tile = memo(TileInner);
