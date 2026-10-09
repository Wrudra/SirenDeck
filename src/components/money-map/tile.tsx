"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import type { UrgencyLevel } from "@/lib/urgency";
import { formatDueDate } from "@/lib/map/cycle";
import { labelBudget, titleMonogram } from "@/lib/map/label-budget";

/** Soft wash of the urgency hue on white. The days figure carries the solid hue. */
export const URGENCY_WASH: Record<UrgencyLevel, string> = {
  calm: "color-mix(in srgb, var(--heat-calm) 22%, white)",
  soon: "color-mix(in srgb, var(--heat-soon) 28%, white)",
  urgent: "color-mix(in srgb, var(--heat-urgent) 32%, white)",
  critical: "color-mix(in srgb, var(--heat-critical) 28%, white)",
  overdue: "color-mix(in srgb, var(--heat-overdue) 24%, white)",
};

/** Darker than the wash so the day count stays readable. */
export const URGENCY_INK: Record<UrgencyLevel, string> = {
  calm: "#0e7a43",
  soon: "#4d7c12",
  urgent: "#8a5a00",
  critical: "#a33b10",
  overdue: "#c42323",
};

/** Kept so existing imports of the fill class still resolve. */
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

/** Critically damped reflow. No bounce on data the user is reading. */
export const SMOOTH_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

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
  /** Snap the tile to the row edge while a narrow lane scrolls. */
  snap?: boolean;
  hot?: boolean;
  selected?: boolean;
  /** Keyboard dismissal skips layout motion. */
  layoutMotion?: boolean;
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
  snap,
  hot,
  selected,
  layoutMotion = true,
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
  const level: UrgencyLevel = daysLeft <= 1 ? "overdue" : urgency;
  const roomy = showTitle && width >= 148 && height >= 120;
  const centered = !showTitle;
  const radius = Math.max(8, Math.min(18, width / 5, height / 5));
  const label = `${title}, ${daysLabel(daysLeft)}, due ${formatDueDate(dueDate)}${cost ? `, ${cost} per year` : ""}${categoryName ? `, ${categoryName}` : ""}`;

  return (
    <motion.button
      type="button"
      layout={!reduced && layoutMotion}
      layoutId={id}
      initial={false}
      exit={{ opacity: 0 }}
      transition={reduced || !layoutMotion ? { duration: 0 } : { layout: SMOOTH_SPRING }}
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
        "group absolute cursor-pointer overflow-visible border-0 bg-transparent p-0 text-left outline-none",
        snap && "snap-start",
        "hover:z-20 focus-visible:z-20",
        (hot || selected) && "z-20",
        URGENCY_PULSE[urgency],
      )}
      style={{ left: x, top: y, width, height }}
    >
      <span
        className={cn(
          "pointer-events-none flex h-full w-full flex-col gap-0.5 overflow-hidden text-ink",
          "origin-center transition-transform duration-100 ease-[var(--ease-out)] group-active:scale-[0.97] motion-reduce:transition-none motion-reduce:group-active:scale-100",
          roomy ? "p-3.5" : "p-1.5",
          centered ? "items-center justify-center text-center" : "items-start justify-start text-left",
          roomy && "shadow-[0_1px_1px_rgb(0_0_0/0.04),0_8px_20px_rgb(0_0_0/0.05)]",
          selected && "shadow-[inset_0_0_0_2px_var(--ink)]",
          hot && !selected && "shadow-[inset_0_0_0_1.5px_var(--ink)]",
          "group-focus-visible:shadow-[inset_0_0_0_2px_var(--ink)]",
        )}
        style={{
          borderRadius: radius,
          background: URGENCY_WASH[level],
        }}
      >
        {showIcon && Icon != null && <Icon aria-hidden className="mb-0.5 size-4 text-ink-muted" />}
        {showTitle && (
          <span
            className={cn(
              "max-w-full font-semibold tracking-[-0.02em] text-ink",
              roomy ? "text-[17px] leading-tight" : "text-[13px] leading-tight",
              titleLines === 1 ? "line-clamp-1" : "line-clamp-2",
            )}
          >
            {title}
          </span>
        )}
        {showMonogram && (
          <span className="text-base leading-none font-semibold tracking-[-0.02em] text-ink">
            {titleMonogram(title)}
          </span>
        )}
        {showTicker && (
          <span
            className={cn("tabular font-semibold tracking-[-0.03em]", roomy ? "text-[22px] leading-none" : "text-sm leading-tight")}
            style={{ color: URGENCY_INK[level] }}
          >
            {daysTicker(daysLeft)}
          </span>
        )}
        {showDate && (
          <span className="tabular text-[12px] leading-snug text-ink-muted">{formatDueDate(dueDate)}</span>
        )}
        {showCost && (
          <span className="tabular text-[12px] leading-snug text-ink-muted">{cost}</span>
        )}
      </span>
    </motion.button>
  );
}

export const Tile = memo(TileInner);
