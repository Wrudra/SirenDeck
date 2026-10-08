import { describe, expect, it } from "vitest";

import { advanceDueDate, completeCycle, planSettlement, rollForward } from "../map/cycle";

const NOW = new Date(2026, 9, 9); // 9 Oct 2026

describe("advanceDueDate", () => {
  it("steps each recurrence from the due date", () => {
    expect(advanceDueDate("2026-10-08", "weekly")).toBe("2026-10-15");
    expect(advanceDueDate("2026-10-08", "monthly")).toBe("2026-11-08");
    expect(advanceDueDate("2026-10-08", "quarterly")).toBe("2027-01-08");
    expect(advanceDueDate("2026-10-08", "yearly")).toBe("2027-10-08");
    expect(advanceDueDate("2026-10-08", "none")).toBeNull();
  });

  it("clamps a month-end date", () => {
    expect(advanceDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(advanceDueDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });
});

describe("rollForward", () => {
  it("leaves a date that is due today", () => {
    expect(rollForward("2026-10-09", "monthly", NOW)).toBe("2026-10-09");
  });

  it("starts the next countdown the day after it was due", () => {
    expect(rollForward("2026-10-08", "weekly", NOW)).toBe("2026-10-15");
    expect(rollForward("2026-10-08", "monthly", NOW)).toBe("2026-11-08");
  });

  it("skips periods that were already missed", () => {
    expect(rollForward("2026-07-01", "monthly", NOW)).toBe("2026-11-01");
  });
});

describe("completeCycle", () => {
  it("moves a future renewal one period ahead", () => {
    expect(completeCycle("2026-10-12", "monthly", NOW)).toBe("2026-11-12");
  });

  it("lands on a date that is not already past", () => {
    expect(completeCycle("2026-08-01", "monthly", NOW)).toBe("2026-11-01");
  });
});

describe("planSettlement", () => {
  const base = {
    status: "active",
    due_date: "2026-10-08",
    auto_renews: false,
    recurrence: "none" as const,
  };

  it("keeps an item on the day it is due", () => {
    expect(planSettlement({ ...base, due_date: "2026-10-09" }, NOW)).toEqual({ kind: "keep" });
  });

  it("marks a one-off done the day after it was due", () => {
    expect(planSettlement(base, NOW)).toEqual({ kind: "done" });
  });

  it("rolls a renewal the day after it was due", () => {
    expect(
      planSettlement({ ...base, auto_renews: true, recurrence: "monthly" }, NOW),
    ).toEqual({ kind: "roll", dueDate: "2026-11-08" });
  });

  it("leaves a snoozed item alone", () => {
    expect(planSettlement({ ...base, status: "snoozed" }, NOW)).toEqual({ kind: "keep" });
  });
});
