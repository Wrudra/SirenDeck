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

/** Formats a money amount with the item's currency, no decimals. */
export function formatCost(
  amount: number | null,
  currency: "BDT" | "USD" | "EUR",
): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/**
 * Compact money for tight spots (e.g. "BDT 242K", "BDT 56K", "$1.2M"). Same currency
 * rendering as {@link formatCost}, abbreviated magnitude.
 */
export function formatCostCompact(
  amount: number | null,
  currency: "BDT" | "USD" | "EUR",
): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      notation: "compact",
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
