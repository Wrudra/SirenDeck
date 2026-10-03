"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import type { UrgencyLevel } from "@/lib/urgency";

export const URGENCY_FILL: Record<UrgencyLevel, string> = {
  calm: "bg-urgency-calm text-on-calm",
  soon: "bg-urgency-soon text-on-soon",
  urgent: "bg-urgency-urgent text-on-urgent",
  critical: "bg-urgency-critical text-on-critical",
  overdue: "bg-urgency-overdue text-on-overdue",
};

export const URGENCY_PULSE: Record<UrgencyLevel, string> = {
  calm: "",
  soon: "tile-pulse-soon",
  urgent: "tile-pulse-urgent",
  critical: "tile-pulse-critical",
  overdue: "tile-pulse-overdue",
};

/** Spring for tile reflow (design token `smooth`). */
export const SMOOTH_SPRING = { type: "spring", stiffness: 260, damping: 30, mass: 1 } as const;

export function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
  if (daysLeft === 0) return "Today";
  if (daysLeft === 1) return "Tomorrow";
  return `${daysLeft}d left`;
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
  /** entrance stagger index (largest-first = 0); undefined = no entrance */
  index?: number;
  onHoverChange?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  onFocusChange?: (id: string | null) => void;
}

/** Below these pixel budgets the in-tile labels drop out (tooltip/focus carries info). */
const LABEL_MIN_W = 90;
const LABEL_MIN_H = 48;

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
  index,
  onHoverChange,
  onSelect,
  onFocusChange,
}: TileProps) {
  const reduced = useReducedMotion();
  const showLabels = width >= LABEL_MIN_W && height >= LABEL_MIN_H;
  const showMoney = showLabels;
  const showIcon = width >= 56 && height >= 32;
  const label = `${title}${cost ? `, ${cost} per year` : ""}, ${daysLabel(daysLeft)}`;

  return (
    <motion.button
      type="button"
      layout={!reduced}
      layoutId={id}
      initial={index != null && !reduced ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      transition={{
        ...SMOOTH_SPRING,
        ...(index != null && !reduced ? { delay: Math.min(index * 0.03, 0.6) } : {}),
      }}
      onClick={() => onSelect?.(id)}
      onHoverStart={() => onHoverChange?.(id)}
      onHoverEnd={() => onHoverChange?.(null)}
      onFocus={() => onFocusChange?.(id)}
      onBlur={() => onFocusChange?.(null)}
      whileHover={reduced ? undefined : { scale: 1.01 }}
      aria-label={label}
      className={cn(
        "group absolute flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-tile)] border border-transparent p-1.5 text-left outline-none",
        "hover:border-ink/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/60",
        "hover:z-20 focus-visible:z-20",
        URGENCY_FILL[urgency],
        URGENCY_PULSE[urgency],
      )}
      style={{ left: x, top: y, width, height }}
    >
      {showIcon && Icon != null && (
        <Icon
          aria-hidden
          className="pointer-events-none absolute right-1.5 top-1.5 size-4 opacity-60"
        />
      )}
      {showLabels && (
        <span className="pointer-events-none mt-0.5 line-clamp-2 text-[13px] leading-[1.25] font-medium">
          {title}
        </span>
      )}
      {showMoney && cost && (
        <span
          className="pointer-events-none mt-auto tabular text-xs"
          style={{ fontFamily: "var(--font-mono-var)" }}
        >
          {cost}
        </span>
      )}
      {showLabels && (
        <span
          className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: "color-mix(in oklab, currentColor 18%, transparent)",
            color: "currentColor",
          }}
        >
          {daysLabel(daysLeft)}
        </span>
      )}
    </motion.button>
  );
}

export const Tile = memo(TileInner);
