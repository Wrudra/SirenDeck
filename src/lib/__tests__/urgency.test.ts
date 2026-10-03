import { describe, expect, it } from "vitest";

import { getUrgency } from "../urgency";

const NOW = new Date("2026-10-03T10:30:00");

describe("getUrgency", () => {
  it("same-day due date is critical (0 days left)", () => {
    expect(getUrgency("2026-10-03", NOW)).toEqual({ daysLeft: 0, level: "critical" });
  });

  it("boundary: 7 days → critical, 8 → urgent", () => {
    expect(getUrgency("2026-10-10", NOW).level).toBe("critical");
    expect(getUrgency("2026-10-11", NOW).level).toBe("urgent");
  });

  it("boundary: 30 days → urgent, 31 → soon", () => {
    expect(getUrgency("2026-11-02", NOW).level).toBe("urgent");
    expect(getUrgency("2026-11-03", NOW).level).toBe("soon");
  });

  it("boundary: 90 days → soon, 91 → calm", () => {
    expect(getUrgency("2027-01-01", NOW).level).toBe("soon");
    expect(getUrgency("2027-01-02", NOW).level).toBe("calm");
  });

  it("past due is overdue with negative days", () => {
    const r = getUrgency("2026-09-30", NOW);
    expect(r.daysLeft).toBe(-3);
    expect(r.level).toBe("overdue");
  });

  it("uses date-only comparison (time of day ignored)", () => {
    expect(getUrgency(new Date("2026-10-03T23:59:00"), NOW).daysLeft).toBe(0);
  });
});
