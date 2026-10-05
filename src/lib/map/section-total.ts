import { formatCost, formatCostCompact } from "@/lib/money";
import type { CurrencyTotal } from "./map-model";

/** Full ledger figure(s): "BDT 242,000", or "BDT 242,000 + $120" across currencies. */
export function formatSectionTotal(totals: readonly CurrencyTotal[]): string {
  return totals.map((t) => formatCost(t.total, t.currency) ?? "").join(" + ");
}

/** Abbreviated figure(s): "BDT 242K", or "BDT 242K + $120". */
export function formatSectionTotalCompact(totals: readonly CurrencyTotal[]): string {
  return totals.map((t) => formatCostCompact(t.total, t.currency) ?? "").join(" + ");
}

// Width estimates for the 22px section title bar (no DOM measuring, so the
// choice is stable during layout animation and testable).
const BAR_PADDING = 16; // px-2 on both sides
const GAP = 8; // gap-2 between name and total
const NAME_CHAR = 7.6; // Inter 14px medium, average glyph
const CHEVRON = 12; // " ›"
const TOTAL_CHAR = 6.7; // JetBrains Mono 11px, fixed advance

/**
 * Picks what fits beside a section name: the full figure, a compact one, or
 * nothing. Name first · the total never truncates the name; it shortens,
 * then hides, as the bar narrows.
 */
export function fitSectionTotal(
  barWidth: number,
  name: string,
  totals: readonly CurrencyTotal[],
): string | null {
  if (totals.length === 0) return null;
  const nameNeed = name.length * NAME_CHAR + CHEVRON;
  const room = barWidth - BAR_PADDING - GAP - nameNeed;
  for (const text of [formatSectionTotal(totals), formatSectionTotalCompact(totals)]) {
    if (text.length * TOTAL_CHAR <= room) return text;
  }
  return null;
}
