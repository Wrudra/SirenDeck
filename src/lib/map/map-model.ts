import { yearlyCost, type Recurrence } from "@/lib/money";
import { getUrgency, type UrgencyLevel } from "@/lib/urgency";
import type { Currency, ItemRow } from "@/lib/validation/item";

export const TILE_CAP = 40;

export interface MapItem {
  id: string;
  title: string;
  categoryId: string;
  /** null = unpriced (goes to the shelf) */
  yearCost: number | null;
  amount: number | null;
  currency: Currency;
  recurrence: Recurrence;
  dueDate: string;
  daysLeft: number;
  urgency: UrgencyLevel;
  autoRenews: boolean;
}

/** Long-tail remainder merged beyond the tile cap. */
export interface OtherTile {
  id: "__other__";
  count: number;
  yearCost: number;
  urgency: UrgencyLevel;
  currency: Currency;
}

export interface SummaryLine {
  totalYearly: number;
  dueIn30: number;
  overdue: number;
}

export interface MapModel {
  /** priced items, largest-first — tile render order (stagger largest first) */
  tiles: MapItem[];
  /** merged long-tail tile, present when priced items exceed the cap */
  other: OtherTile | null;
  /** unpriced items for the shelf, most urgent first */
  shelf: MapItem[];
  /** totals per currency code */
  totals: { currency: Currency; line: SummaryLine }[];
  itemCount: number;
}

function toMapItem(item: ItemRow, now: Date): MapItem {
  const amount = item.amount == null ? null : Number(item.amount);
  const yearCost = yearlyCost({ amount, recurrence: item.recurrence });
  const { daysLeft, level } = getUrgency(item.due_date, now);

  return {
    id: item.id,
    title: item.title,
    categoryId: item.category_id,
    yearCost,
    amount,
    currency: item.currency,
    recurrence: item.recurrence,
    dueDate: item.due_date,
    daysLeft,
    urgency: level,
    autoRenews: item.auto_renews,
  };
}

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  overdue: 0,
  critical: 1,
  urgent: 2,
  soon: 3,
  calm: 4,
};

/** Shelf order: most urgent unpriced item first. */
function byShelfOrder(a: MapItem, b: MapItem): number {
  const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
  return u !== 0 ? u : a.daysLeft - b.daysLeft;
}

/**
 * Derives the Money Map view model. Pure — same input, same output.
 * `now` and `tileCap` are injectable for tests / "Other" expansion.
 */
export function buildMapModel(
  items: ItemRow[],
  now: Date = new Date(),
  tileCap: number = TILE_CAP,
): MapModel {
  const mapItems = items.map((item) => toMapItem(item, now));

  const priced = mapItems
    .filter((i) => i.yearCost != null && i.yearCost > 0)
    .sort((a, b) => (b.yearCost ?? 0) - (a.yearCost ?? 0));

  // Unpriced or zero-cost: no meaningful tile area, so they live on the shelf.
  const shelf = mapItems
    .filter((i) => i.yearCost == null || i.yearCost <= 0)
    .sort(byShelfOrder);

  const tiles = priced.slice(0, tileCap);
  const rest = priced.slice(tileCap);

  let other: OtherTile | null = null;
  if (rest.length > 0) {
    // `priced` is sorted by cost; urgency is independent, so find the most
    // urgent merged item explicitly (min daysLeft).
    const mostUrgent = rest.reduce((a, b) => (b.daysLeft < a.daysLeft ? b : a));
    other = {
      id: "__other__",
      count: rest.length,
      yearCost: rest.reduce((sum, i) => sum + (i.yearCost ?? 0), 0),
      urgency: mostUrgent.urgency,
      currency: mostUrgent.currency,
    };
  }

  // Per-currency summary lines.
  const byCurrency = new Map<Currency, SummaryLine>();
  for (const item of mapItems) {
    if (item.yearCost == null) continue;
    let line = byCurrency.get(item.currency);
    if (!line) {
      line = { totalYearly: 0, dueIn30: 0, overdue: 0 };
      byCurrency.set(item.currency, line);
    }
    line.totalYearly += item.yearCost;
    if (item.daysLeft < 0) line.overdue += item.yearCost;
    else if (item.daysLeft <= 30) line.dueIn30 += item.yearCost;
  }
  const totals = [...byCurrency.entries()].map(([currency, line]) => ({ currency, line }));

  return { tiles, other, shelf, totals, itemCount: items.length };
}
