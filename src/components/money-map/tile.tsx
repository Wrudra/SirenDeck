"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import type { UrgencyLevel } from "@/lib/urgency";

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
  cost: string | null;
  daysLeft: number;
  urgency: UrgencyLevel;
  icon: LucideIcon | null;
  /** the soonest due item on the board */
  isSoonest?: boolean;
  hot?: boolean;
  selected?: boolean;
  /** entrance stagger index (largest-first = 0); undefined = no entrance */
  index?: number;
  onHoverChange?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  onFocusChange?: (id: string | null) => void;
}

/** Pixel budgets for the in-tile labels (TradingView-style density). */
const FULL_MIN_W = 72;
const TICKER_MIN = 36;

/** Rough line heights (px) of the stacked labels, incl. their gap. */
const PAD_Y = 12; // p-1.5 top + bottom
const PAD_X = 28; // p-1.5 + px-2, both sides
const TITLE_LINE = 20; // text-base leading-tight
const TITLE_CHAR = 9; // avg glyph width, semibold 16px
const TICKER_LINE = 22;
const COST_LINE = 18;
const ICON_LINE = 22;

/**
 * Which labels fit, top-down by priority (title + ticker, then cost, then
 * icon), so a short tile drops extras instead of clipping its title.
 */
function labelBudget(width: number, height: number, title: string, hasCost: boolean, hasIcon: boolean) {
  const showTicker = width >= TICKER_MIN && height >= TICKER_MIN;
  const textW = Math.max(width - PAD_X, 1);
  const titleLines = Math.min(2, Math.ceil((title.length * TITLE_CHAR) / textW));
  let used = PAD_Y + titleLines * TITLE_LINE + TICKER_LINE;
  const showFull = width >= FULL_MIN_W && height >= used;
  const showCost = showFull && hasCost && height >= used + COST_LINE;
  if (showCost) used += COST_LINE;
  const showIcon = showFull && hasIcon && width >= 96 && height >= used + ICON_LINE;
  return { showFull, showTicker, showCost, showIcon };
}

function TileInner({
  id,
  x,
  y,
  width,
  height,
  title,
  cost,
  daysLeft,
  urgency,
  icon: Icon,
  isSoonest,
  hot,
  selected,
  index,
  onHoverChange,
  onSelect,
  onOpen,
  onFocusChange,
}: TileProps) {
  const reduced = useReducedMotion();
  const { showFull, showTicker, showCost, showIcon } = labelBudget(
    width,
    height,
    title,
    cost != null,
    Icon != null,
  );
  const label = `${title}${cost ? `, ${cost} per year` : ""}, ${daysLabel(daysLeft)}`;

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
      onClick={() => onSelect?.(id)}
      onDoubleClick={() => onOpen?.(id)}
      onHoverStart={() => onHoverChange?.(id)}
      onHoverEnd={() => onHoverChange?.(null)}
      onFocus={() => onFocusChange?.(id)}
      onBlur={() => onFocusChange?.(null)}
      aria-label={label}
      className={cn(
        "group absolute flex cursor-pointer flex-col items-center justify-center overflow-hidden border border-transparent p-1.5 text-center outline-none",
        "focus-visible:ring-2 focus-visible:ring-heat-ink/70",
        "hover:z-20 focus-visible:z-20",
        (hot || selected) && "z-20 shadow-[inset_0_0_0_2px_#1c1917]",
        URGENCY_FILL[urgency],
        URGENCY_PULSE[urgency],
      )}
      style={{ left: x, top: y, width, height }}
    >
      <span className="pointer-events-none flex h-full w-full flex-col items-center justify-center gap-0.5 px-2 text-center">
        {showIcon && Icon != null && <Icon aria-hidden className="mb-0.5 size-4 opacity-80" />}
        {showFull && (
          <span className="line-clamp-2 text-base leading-tight font-semibold tracking-[-0.01em]">
            {title}
          </span>
        )}
        {showTicker && (
          <span className="tabular text-sm font-semibold" style={{ fontFamily: "var(--font-mono-var)" }}>
            {daysTicker(daysLeft)}
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
