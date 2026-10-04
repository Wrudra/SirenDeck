"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import type { UrgencyLevel } from "@/lib/urgency";

/** Heatmap fills · TradingView-style green→red. White text on all levels. */
export const URGENCY_FILL: Record<UrgencyLevel, string> = {
  calm: "bg-heat-calm text-heat-ink",
  soon: "bg-heat-soon text-heat-ink",
  urgent: "bg-heat-urgent text-heat-ink",
  critical: "bg-heat-critical text-heat-ink",
  overdue: "bg-heat-overdue text-heat-ink",
};

/** Small-cap urgency labels (TradingView "industry" sub-label). */
const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  calm: "CALM",
  soon: "SOON",
  urgent: "URGENT",
  critical: "CRITICAL",
  overdue: "OVERDUE",
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
  /** the soonest due item on the board · gets a bright hairline */
  isSoonest?: boolean;
  /** entrance stagger index (largest-first = 0); undefined = no entrance */
  index?: number;
  onHoverChange?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onFocusChange?: (id: string | null) => void;
}

/** Pixel budgets for the in-tile labels (TradingView-style density). */
const FULL_MIN_W = 96;
const FULL_MIN_H = 60;
const SUBHEAD_MIN_W = 60;
const SUBHEAD_MIN_H = 44;
const TICKER_MIN = 40;

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
  index,
  onHoverChange,
  onSelect,
  onFocusChange,
}: TileProps) {
  const reduced = useReducedMotion();
  const showFull = width >= FULL_MIN_W && height >= FULL_MIN_H;
  const showSubhead = width >= SUBHEAD_MIN_W && height >= SUBHEAD_MIN_H;
  const showTicker = width >= TICKER_MIN && height >= TICKER_MIN;
  const showCost = showFull && cost != null;
  const showIcon = showFull && Icon != null;
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
      onClick={() => onSelect?.(id)}
      onHoverStart={() => onHoverChange?.(id)}
      onHoverEnd={() => onHoverChange?.(null)}
      onFocus={() => onFocusChange?.(id)}
      onBlur={() => onFocusChange?.(null)}
      whileHover={reduced ? undefined : { scale: 1.005 }}
      aria-label={label}
      className={cn(
        "group absolute flex cursor-pointer flex-col overflow-hidden border-[0.5px] p-1.5 text-left outline-none",
        isSoonest ? "border-heat-ink" : "border-heat-rule/60",
        "focus-visible:ring-2 focus-visible:ring-heat-ink/70",
        "hover:z-20 focus-visible:z-20",
        URGENCY_FILL[urgency],
        URGENCY_PULSE[urgency],
      )}
      style={{ left: x, top: y, width, height }}
    >
      {showSubhead && (
        <span
          className="ledger-cap pointer-events-none truncate text-[8px] tracking-[0.1em] text-heat-ink-muted"
          aria-hidden
        >
          {URGENCY_LABEL[urgency]}
        </span>
      )}
      {showTicker && (
        <span
          className="tabular pointer-events-none absolute right-1.5 top-1 text-[11px] font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-mono-var)" }}
        >
          {daysTicker(daysLeft)}
        </span>
      )}
      {showFull && (
        <span
          className="pointer-events-none mt-auto line-clamp-2 text-[13px] leading-[1.15] font-semibold tracking-[-0.01em]"
        >
          {title}
        </span>
      )}
      {showCost && (
        <span
          className="tabular pointer-events-none text-[9px] text-heat-ink-muted"
          style={{ fontFamily: "var(--font-mono-var)" }}
        >
          {cost}
        </span>
      )}
      {showIcon && Icon != null && (
        <Icon
          aria-hidden
          className="pointer-events-none absolute right-1.5 bottom-1 size-3 text-heat-ink-muted/70"
        />
      )}
    </motion.button>
  );
}

export const Tile = memo(TileInner);
