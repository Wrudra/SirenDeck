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
  /** the soonest due item on the board · gets the ink anchor ring */
  isSoonest?: boolean;
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
  isSoonest,
  index,
  onHoverChange,
  onSelect,
  onFocusChange,
}: TileProps) {
  const reduced = useReducedMotion();
  const showLabels = width >= LABEL_MIN_W && height >= LABEL_MIN_H;
  const showSubhead = width >= 70 && height >= 60;
  const showDays = showLabels;
  const showCost = showLabels;
  const showIcon = width >= 56 && height >= 32;
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
      whileHover={reduced ? undefined : { scale: 1.01 }}
      aria-label={label}
      className={cn(
        "group absolute flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius-tile)] border p-1.5 text-left outline-none",
        isSoonest
          ? "border-ink ring-1 ring-ink ring-offset-1 ring-offset-bg"
          : "border-ink/20 hover:border-ink/45",
        "focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/50",
        "hover:z-20 focus-visible:z-20",
        URGENCY_FILL[urgency],
        URGENCY_PULSE[urgency],
      )}
      style={{ left: x, top: y, width, height }}
    >
      {showSubhead && (
        <span
          className="ledger-cap pointer-events-none truncate text-[8px] tracking-[0.1em] opacity-70"
          aria-hidden
        >
          {urgency === "overdue"
            ? "OVERDUE"
            : urgency === "critical"
              ? "CRITICAL"
              : urgency === "urgent"
                ? "URGENT"
                : urgency === "soon"
                  ? "SOON"
                  : "CALM"}
        </span>
      )}
      {showLabels && (
        <span className="pointer-events-none line-clamp-2 text-[13px] leading-[1.2] font-semibold tracking-[-0.005em]">
          {title}
        </span>
      )}
      {showCost && cost && (
        <span
          className="tabular pointer-events-none mt-auto text-[10px] opacity-75"
          style={{ fontFamily: "var(--font-mono-var)" }}
        >
          {cost}
        </span>
      )}
      {showDays && (
        <span
          className="tabular pointer-events-none absolute bottom-1 right-1.5 text-[11px] font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-mono-var)" }}
        >
          {daysLabel(daysLeft)}
        </span>
      )}
      {showIcon && Icon != null && (
        <Icon
          aria-hidden
          className="pointer-events-none absolute right-1.5 top-1.5 size-3.5 opacity-40"
        />
      )}
    </motion.button>
  );
}

export const Tile = memo(TileInner);
