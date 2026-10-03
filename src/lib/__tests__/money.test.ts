import { describe, expect, it } from "vitest";

import { yearlyCost } from "../money";

describe("yearlyCost", () => {
  it("scales by recurrence", () => {
    expect(yearlyCost({ amount: 10, recurrence: "weekly" })).toBe(520);
    expect(yearlyCost({ amount: 100, recurrence: "monthly" })).toBe(1200);
    expect(yearlyCost({ amount: 100, recurrence: "quarterly" })).toBe(400);
    expect(yearlyCost({ amount: 120, recurrence: "yearly" })).toBe(120);
    expect(yearlyCost({ amount: 50, recurrence: "none" })).toBe(50);
  });

  it("unpriced items are null", () => {
    expect(yearlyCost({ amount: null, recurrence: "monthly" })).toBeNull();
  });
});
