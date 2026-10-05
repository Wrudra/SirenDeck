import { describe, expect, it } from "vitest";

import { buildMapModel, sumCategoryTotals, TILE_CAP } from "../map/map-model";
import type { ItemRow } from "../validation/item";

const NOW = new Date("2026-10-04T00:00:00");

function item(over: Partial<ItemRow> & { id: string }): ItemRow {
  return {
    user_id: "u1",
    category_id: "c1",
    title: over.title ?? "Item",
    notes: null,
    due_date: "2026-12-01",
    status: "active",
    recurrence: "yearly",
    auto_renews: false,
    amount: null,
    currency: "BDT",
    snoozed_until: null,
    completed_at: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...over,
  };
}

describe("buildMapModel", () => {
  it("splits priced and unpriced; shelf sorted most-urgent first", () => {
    const model = buildMapModel(
      [
        item({ id: "a", title: "unpriced", amount: null, due_date: "2026-12-01" }),
        item({ id: "b", title: "priced calm", amount: "100", due_date: "2027-06-01" }),
        item({ id: "c", title: "unpriced urgent", amount: null, due_date: "2026-10-06" }),
      ],
      NOW,
    );

    expect(model.tiles.map((t) => t.id)).toEqual(["b"]);
    expect(model.shelf.map((s) => s.id)).toEqual(["c", "a"]);
    expect(model.itemCount).toBe(3);
  });

  it("sorts tiles largest yearCost first", () => {
    const model = buildMapModel(
      [
        item({ id: "small", amount: "10" }),
        item({ id: "big", amount: "500" }),
        item({ id: "mid", amount: "100", recurrence: "monthly" }), // 1200/yr
      ],
      NOW,
    );
    expect(model.tiles.map((t) => t.id)).toEqual(["mid", "big", "small"]);
  });

  it("merges long tail beyond the cap into Other with summed cost", () => {
    // items i0..i44 (45 total), amounts 100..56 · cap keeps i0..i39, merges i40..i44
    const items = Array.from({ length: TILE_CAP + 5 }, (_, i) =>
      item({ id: `i${i}`, amount: String(100 - i) }),
    );
    const model = buildMapModel(items, NOW);

    expect(model.tiles).toHaveLength(TILE_CAP);
    expect(model.other).not.toBeNull();
    expect(model.other!.count).toBe(5);
    expect(model.other!.yearCost).toBe(60 + 59 + 58 + 57 + 56);
  });

  it("computes per-currency totals including 30d and overdue splits", () => {
    const model = buildMapModel(
      [
        item({ id: "a", amount: "100", recurrence: "monthly", due_date: "2026-10-10" }), // 1200/yr, due in 6d
        item({ id: "b", amount: "50", due_date: "2026-09-01" }), // 50/yr, overdue
        item({ id: "c", amount: "10", currency: "USD", due_date: "2027-01-01" }),
        item({ id: "d", amount: null, due_date: "2026-10-10" }),
      ],
      NOW,
    );

    const bdt = model.totals.find((t) => t.currency === "BDT")!.line;
    expect(bdt.totalYearly).toBe(1250);
    expect(bdt.dueIn30).toBe(1200);
    expect(bdt.overdue).toBe(50);

    const usd = model.totals.find((t) => t.currency === "USD")!.line;
    expect(usd.totalYearly).toBe(10);
    expect(model.totals).toHaveLength(2);
  });

  it("zero-cost items are excluded from tiles but kept on the shelf", () => {
    const model = buildMapModel(
      [item({ id: "zero", amount: "0", due_date: "2026-12-01" })],
      NOW,
    );
    expect(model.tiles).toHaveLength(0);
    expect(model.shelf.map((s) => s.id)).toEqual(["zero"]);
  });

  it("totals yearly cost per category and currency, ignoring unpriced", () => {
    const model = buildMapModel(
      [
        item({ id: "a", category_id: "ins", amount: "200000" }),
        item({ id: "b", category_id: "ins", amount: "3500", recurrence: "monthly" }), // 42,000/yr
        item({ id: "c", category_id: "ins", amount: null }),
        item({ id: "d", category_id: "subs", amount: "10", currency: "USD", recurrence: "monthly" }),
        item({ id: "e", category_id: "subs", amount: "500", recurrence: "monthly" }),
      ],
      NOW,
    );

    expect(model.categoryTotals.get("ins")).toEqual([{ currency: "BDT", total: 242_000 }]);
    expect(model.categoryTotals.get("subs")).toEqual([
      { currency: "BDT", total: 6000 },
      { currency: "USD", total: 120 },
    ]);
  });

  it("category totals include items merged past the tile cap", () => {
    const items = Array.from({ length: TILE_CAP + 5 }, (_, i) =>
      item({ id: `i${i}`, amount: "10" }),
    );
    const model = buildMapModel(items, NOW);
    expect(model.categoryTotals.get("c1")).toEqual([
      { currency: "BDT", total: 10 * (TILE_CAP + 5) },
    ]);
  });

  it("sums folded categories for the Other section, per currency", () => {
    const model = buildMapModel(
      [
        item({ id: "a", category_id: "x", amount: "100" }),
        item({ id: "b", category_id: "y", amount: "250" }),
        item({ id: "c", category_id: "y", amount: "5", currency: "USD" }),
        item({ id: "d", category_id: "z", amount: "9999" }),
      ],
      NOW,
    );
    expect(sumCategoryTotals(model.categoryTotals, ["x", "y", "missing"])).toEqual([
      { currency: "BDT", total: 350 },
      { currency: "USD", total: 5 },
    ]);
    expect(sumCategoryTotals(model.categoryTotals, [])).toEqual([]);
  });
});
