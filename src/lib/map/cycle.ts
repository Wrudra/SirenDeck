import type { Recurrence } from "@/lib/money";
import { getUrgency } from "@/lib/urgency";

/** Compact calendar date for a tile, e.g. "9 Oct 2026". */
export function formatDueDate(iso: string): string {
  const due = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(due);
}

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Add calendar months, clamping the day so 31 Jan + 1 month is 28 Feb. */
function addMonths(iso: string, months: number): string {
  const due = new Date(`${iso}T00:00:00`);
  const day = due.getDate();
  const target = new Date(due.getFullYear(), due.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return formatISODate(new Date(target.getFullYear(), target.getMonth(), Math.min(day, last)));
}

/** The due date one recurrence later. `none` has no next date. */
export function advanceDueDate(dueDate: string, recurrence: Recurrence): string | null {
  if (recurrence === "none") return null;
  if (recurrence === "weekly") {
    const due = new Date(`${dueDate}T00:00:00`);
    return formatISODate(new Date(due.getFullYear(), due.getMonth(), due.getDate() + 7));
  }
  if (recurrence === "monthly") return addMonths(dueDate, 1);
  if (recurrence === "quarterly") return addMonths(dueDate, 3);
  return addMonths(dueDate, 12);
}

/**
 * Walk forward by the recurrence until the date is today or still ahead.
 * A date that is already today (0 days) stays put.
 */
export function rollForward(dueDate: string, recurrence: Recurrence, now: Date): string {
  let current = dueDate;
  for (let step = 0; step < 520; step += 1) {
    if (getUrgency(current, now).daysLeft >= 0) return current;
    const next = advanceDueDate(current, recurrence);
    if (!next || next === current) return current;
    current = next;
  }
  return current;
}

/**
 * Manual "done" on a renewing item: move at least one period, then skip
 * any dates that are already past so the countdown is +n again.
 */
export function completeCycle(dueDate: string, recurrence: Recurrence, now: Date): string | null {
  const stepped = advanceDueDate(dueDate, recurrence);
  if (!stepped) return null;
  return rollForward(stepped, recurrence, now);
}

export type Settlement =
  | { kind: "keep" }
  | { kind: "done" }
  | { kind: "roll"; dueDate: string };

/**
 * What to do when the app opens.
 * Day 0 stays. The next day (−1), a one-off is done and a renewal rolls
 * forward to the next date that is today or later. Snoozed items wait.
 */
export function planSettlement(
  item: {
    status: string;
    due_date: string;
    auto_renews: boolean;
    recurrence: Recurrence;
  },
  now: Date,
): Settlement {
  if (item.status !== "active") return { kind: "keep" };
  if (getUrgency(item.due_date, now).daysLeft > -1) return { kind: "keep" };
  if (item.auto_renews && item.recurrence !== "none") {
    const dueDate = rollForward(item.due_date, item.recurrence, now);
    if (dueDate === item.due_date) return { kind: "keep" };
    return { kind: "roll", dueDate };
  }
  if (!item.auto_renews) return { kind: "done" };
  return { kind: "keep" };
}
