/**
 * Treemap area for one item. Smaller `daysLeft` is larger:
 * further overdue, then due today, then further in the future.
 *
 * The scale runs from 1 to 3. Fourteen days overdue is the ceiling, and
 * anything past 120 days shares the floor, so the soonest tile is at most
 * three times a far one. A single ancient date stays the biggest box
 * without erasing its neighbors.
 */
const OVERDUE_CAP_DAYS = 14;
const FAR_HORIZON_DAYS = 120;
const SPAN_DAYS = FAR_HORIZON_DAYS - -OVERDUE_CAP_DAYS;
const MIN_WEIGHT = 1;
const MAX_WEIGHT = 3;

export function deadlineWeight(daysLeft: number): number {
  if (!Number.isFinite(daysLeft)) return MIN_WEIGHT;
  const capped = Math.max(-OVERDUE_CAP_DAYS, Math.min(daysLeft, FAR_HORIZON_DAYS));
  const closeness = (FAR_HORIZON_DAYS - capped) / SPAN_DAYS;
  return MIN_WEIGHT + closeness * (MAX_WEIGHT - MIN_WEIGHT);
}
