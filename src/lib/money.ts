import type { Recurrence } from "./validation/item";

export type { Recurrence };

const PER_YEAR: Record<Recurrence, number | null> = {
  none: 1,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

/**
 * Yearly cost of an item; null when unpriced.
 * `none` (one-off) counts once per year it's due.
 */
export function yearlyCost(item: {
  amount: number | null;
  recurrence: Recurrence;
}): number | null {
  if (item.amount == null) return null;
  const perYear = PER_YEAR[item.recurrence];
  if (perYear == null) return null;
  return item.amount * perYear;
}
