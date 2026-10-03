export type UrgencyLevel = "calm" | "soon" | "urgent" | "critical" | "overdue";

export interface Urgency {
  daysLeft: number;
  level: UrgencyLevel;
}

/**
 * Pure urgency calculation from a due date.
 * calm >90d · soon 30–90d · urgent 7–30d · critical 0–7d · overdue <0d.
 */
export function getUrgency(
  dueDate: string | Date,
  now: Date = new Date(),
): Urgency {
  const due = dueDate instanceof Date ? dueDate : new Date(`${dueDate}T00:00:00`);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const msPerDay = 86_400_000;
  const daysLeft = Math.round((dueDay.getTime() - today.getTime()) / msPerDay);

  let level: UrgencyLevel;
  if (daysLeft < 0) level = "overdue";
  else if (daysLeft <= 7) level = "critical";
  else if (daysLeft <= 30) level = "urgent";
  else if (daysLeft <= 90) level = "soon";
  else level = "calm";

  return { daysLeft, level };
}
