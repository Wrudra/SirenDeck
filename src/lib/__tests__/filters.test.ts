import { describe, expect, it } from "vitest";

import { applyFilters, hasActiveFilters, parseFilters } from "../filters";
import type { ItemRow } from "../validation/item";

const NOW = new Date("2026-10-04T00:00:00");

function item(over: Partial<ItemRow> & { id: string }): ItemRow {
  return {
    user_id: "u1",
    category_id: "c1",
    title: "Item",
    notes: null,
    due_date: "2026-12-01",
    status: "active",
    recurrence: "yearly",
    auto_renews: false,
    amount: "100",
    currency: "BDT",
    snoozed_until: null,
    completed_at: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...over,
  };
}

const CAT_A = "11111111-1111-4111-8111-111111111111";
const CAT_B = "22222222-2222-4222-8222-222222222222";

describe("parseFilters", () => {
  it("defaults on empty params", () => {
    expect(parseFilters({})).toEqual({
      q: "",
      categoryId: null,
      urgency: null,
      autoRenew: null,
      window: "all",
    });
  });

  it("accepts valid values", () => {
    const f = parseFilters({
      q: "  netflix ",
      category: CAT_A,
      urgency: "critical",
      renew: "yes",
      window: "90",
    });
    expect(f.q).toBe("netflix");
    expect(f.categoryId).toBe(CAT_A);
    expect(f.urgency).toBe("critical");
    expect(f.autoRenew).toBe(true);
    expect(f.window).toBe("90");
  });

  it("falls back to defaults on invalid values (no throw)", () => {
    const f = parseFilters({
      q: "x".repeat(200),
      category: "not-a-uuid",
      urgency: "tomorrow",
      renew: "maybe",
      window: "7",
    });
    expect(f.q).toHaveLength(120);
    expect(f.categoryId).toBeNull();
    expect(f.urgency).toBeNull();
    expect(f.autoRenew).toBeNull();
    expect(f.window).toBe("all");
  });

  it("takes first value of array params", () => {
    expect(parseFilters({ urgency: ["soon", "calm"] }).urgency).toBe("soon");
  });
});

describe("applyFilters", () => {
  const items = [
    item({ id: "a", title: "Netflix", category_id: CAT_A, due_date: "2026-10-06", auto_renews: true }), // critical
    item({ id: "b", title: "Passport", category_id: CAT_B, due_date: "2027-03-01" }), // calm
    item({ id: "c", title: "Car insurance", notes: "policy 55-22", due_date: "2026-09-20" }), // overdue
  ];

  it("query matches title case-insensitively, and notes", () => {
    expect(applyFilters(items, parseFilters({ q: "NETFLIX" }), NOW).map((i) => i.id)).toEqual(["a"]);
    expect(applyFilters(items, parseFilters({ q: "55-22" }), NOW).map((i) => i.id)).toEqual(["c"]);
  });

  it("category, urgency, renew, window combine as AND", () => {
    expect(applyFilters(items, parseFilters({ category: CAT_B }), NOW).map((i) => i.id)).toEqual(["b"]);
    expect(applyFilters(items, parseFilters({ urgency: "overdue" }), NOW).map((i) => i.id)).toEqual(["c"]);
    expect(applyFilters(items, parseFilters({ renew: "yes" }), NOW).map((i) => i.id)).toEqual(["a"]);
    // window 30d: due within 30d OR overdue
    expect(applyFilters(items, parseFilters({ window: "30" }), NOW).map((i) => i.id)).toEqual(["a", "c"]);
    const both = parseFilters({ urgency: "critical", renew: "yes" });
    expect(applyFilters(items, both, NOW).map((i) => i.id)).toEqual(["a"]);
  });

  it("no filters returns everything", () => {
    expect(applyFilters(items, parseFilters({}), NOW)).toHaveLength(3);
    expect(hasActiveFilters(parseFilters({}))).toBe(false);
    expect(hasActiveFilters(parseFilters({ window: "30" }))).toBe(true);
  });
});
