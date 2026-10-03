import { z } from "zod";

import { getUrgency, type UrgencyLevel } from "@/lib/urgency";
import type { ItemRow } from "@/lib/validation/item";

export const URGENCIES = ["overdue", "critical", "urgent", "soon", "calm"] as const;
export const WINDOWS = ["30", "90", "180", "365", "all"] as const;

export type WindowValue = (typeof WINDOWS)[number];

export interface ItemFilters {
  /** free-text match on title (case-insensitive substring) */
  q: string;
  categoryId: string | null;
  urgency: UrgencyLevel | null;
  autoRenew: boolean | null;
  /** show only items due within N days (overdue always included) */
  window: WindowValue;
}

export const DEFAULT_FILTERS: ItemFilters = {
  q: "",
  categoryId: null,
  urgency: null,
  autoRenew: null,
  window: "all",
};

const urgencySchema = z.enum(URGENCIES);
const windowSchema = z.enum(WINDOWS);
const uuidSchema = z.string().uuid();

/**
 * Parses raw URL search params into validated filters. Invalid or unknown
 * values fall back to defaults rather than erroring — filter URLs are
 * shareable and must not 500 on hand-edited params.
 */
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ItemFilters {
  const first = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;

  const q = first(params.q)?.trim() ?? "";
  const category = first(params.category);
  const urgency = urgencySchema.safeParse(first(params.urgency));
  const renew = first(params.renew);
  const window = windowSchema.safeParse(first(params.window));

  return {
    q: q.slice(0, 120),
    categoryId: category && uuidSchema.safeParse(category).success ? category : null,
    urgency: urgency.success ? urgency.data : null,
    autoRenew: renew === "yes" ? true : renew === "no" ? false : null,
    window: window.success ? window.data : "all",
  };
}

/** True when a filter other than defaults is active. */
export function hasActiveFilters(filters: ItemFilters): boolean {
  return (
    filters.q !== "" ||
    filters.categoryId !== null ||
    filters.urgency !== null ||
    filters.autoRenew !== null ||
    filters.window !== "all"
  );
}

/** Window match — overdue items always pass any finite window. */
function matchesWindow(item: ItemRow, window: WindowValue, now: Date): boolean {
  if (window === "all") return true;
  return getUrgency(item.due_date, now).daysLeft <= Number(window);
}

/**
 * Pure predicate filter over items. Search matches title (and notes as a
 * secondary signal). Window/urgency computed from due_date at render time.
 */
export function applyFilters(
  items: ItemRow[],
  filters: ItemFilters,
  now: Date = new Date(),
): ItemRow[] {
  const needle = filters.q.toLowerCase();

  return items.filter((item) => {
    if (filters.categoryId != null && item.category_id !== filters.categoryId) return false;
    if (filters.autoRenew != null && item.auto_renews !== filters.autoRenew) return false;
    if (filters.urgency != null && getUrgency(item.due_date, now).level !== filters.urgency) {
      return false;
    }
    if (!matchesWindow(item, filters.window, now)) return false;

    if (needle !== "") {
      const title = item.title.toLowerCase();
      const notes = item.notes?.toLowerCase() ?? "";
      if (!title.includes(needle) && !notes.includes(needle)) return false;
    }
    return true;
  });
}
