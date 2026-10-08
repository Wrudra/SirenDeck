import { deadlineWeight } from "@/lib/map/deadline-weight";
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
  /** Treemap area. Sooner (and more overdue) is larger. Independent of cost. */
  layoutWeight: number;
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

/** One currency's share of a yearly total. */
export interface CurrencyTotal {
  currency: Currency;
  total: number;
}

export interface MapModel {
  /** Board items, soonest first. Area follows layoutWeight, not cost. */
  tiles: MapItem[];
  /** Items past the tile cap: the furthest deadlines, not the cheapest. */
  other: OtherTile | null;
  /** Kept for the shelf component. Deadlines now all have area, so this stays empty. */
  shelf: MapItem[];
  /** totals per currency code */
  totals: { currency: Currency; line: SummaryLine }[];
  /**
   * categoryId → yearly cost of every priced item in that category, one
   * entry per currency (largest first). Includes items merged past the tile
   * cap, so a section title shows the category's true yearly total.
   */
  categoryTotals: Map<string, CurrencyTotal[]>;
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
    layoutWeight: deadlineWeight(daysLeft),
    urgency: level,
    autoRenews: item.auto_renews,
  };
}

/**
 * Soonest deadline first. Same day: higher yearly cost, then id.
 * The tile cap keeps this prefix, so a cheap item due tomorrow is never
 * dropped to keep an expensive one due next year.
 */
function byDeadline(a: MapItem, b: MapItem): number {
  if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft;
  const cost = (b.yearCost ?? 0) - (a.yearCost ?? 0);
  if (cost !== 0) return cost;
  return a.id.localeCompare(b.id);
}

/**
 * Derives the Money Map view model. Pure · same input, same output.
 * `now` and `tileCap` are injectable for tests / "Other" expansion.
 */
export function buildMapModel(
  items: ItemRow[],
  now: Date = new Date(),
  tileCap: number = TILE_CAP,
): MapModel {
  const mapItems = items.map((item) => toMapItem(item, now));

  // Every item has a deadline, so every item can take area. Cost stays on
  // the label. Unpriced rows used to sit on a shelf because cost was the weight.
  const ranked = [...mapItems].sort(byDeadline);
  const shelf: MapItem[] = [];

  const tiles = ranked.slice(0, tileCap);
  const rest = ranked.slice(tileCap);

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

  // Per-category yearly totals (section titles).
  const byCategory = new Map<string, Map<Currency, number>>();
  for (const item of mapItems) {
    const sums = byCategory.get(item.categoryId) ?? new Map<Currency, number>();
    sums.set(item.currency, (sums.get(item.currency) ?? 0) + (item.yearCost ?? 0));
    byCategory.set(item.categoryId, sums);
  }
  const categoryTotals = new Map<string, CurrencyTotal[]>();
  for (const [id, sums] of byCategory) categoryTotals.set(id, sortTotals(sums));

  return { tiles, other, shelf, totals, categoryTotals, itemCount: items.length };
}

function sortTotals(sums: Map<Currency, number>): CurrencyTotal[] {
  return [...sums.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total || a.currency.localeCompare(b.currency));
}

/**
 * Yearly total across several categories (the synthetic Other section),
 * still split per currency · amounts in different currencies never mix.
 */
export function sumCategoryTotals(
  categoryTotals: Map<string, CurrencyTotal[]>,
  categoryIds: readonly string[],
): CurrencyTotal[] {
  const sums = new Map<Currency, number>();
  for (const id of new Set(categoryIds)) {
    for (const { currency, total } of categoryTotals.get(id) ?? []) {
      sums.set(currency, (sums.get(currency) ?? 0) + total);
    }
  }
  return sortTotals(sums);
}
