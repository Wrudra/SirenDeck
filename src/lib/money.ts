import type { Recurrence } from "./validation/item";

export type { Recurrence };

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
