import { describe, expect, it } from "vitest";

import { deadlineWeight } from "../map/deadline-weight";
import { layoutFlat, layoutOrdered } from "../map/treemap";

function area(id: string, rects: { id: string; width: number; height: number }[]) {
  const r = rects.find((x) => x.id === id);
  if (!r) throw new Error(`missing ${id}`);
  return r.width * r.height;
}

describe("deadlineWeight", () => {
  it("orders overdue, then today, then the future", () => {
    const overdue = deadlineWeight(-3);
    const today = deadlineWeight(0);
    const week = deadlineWeight(7);
    const month = deadlineWeight(30);
    const quarter = deadlineWeight(90);
    expect(overdue).toBeGreaterThan(today);
    expect(today).toBeGreaterThan(week);
    expect(week).toBeGreaterThan(month);
    expect(month).toBeGreaterThan(quarter);
  });

  it("keeps the soonest tile at most three times a far one", () => {
    expect(deadlineWeight(-14) / deadlineWeight(120)).toBeCloseTo(3, 5);
    expect(deadlineWeight(-14)).toBeCloseTo(3, 5);
    expect(deadlineWeight(120)).toBeCloseTo(1, 5);
    expect(deadlineWeight(0)).toBeGreaterThan(deadlineWeight(21));
  });

  it("caps ancient overdue so one old item cannot grow without limit", () => {
    expect(deadlineWeight(-14)).toBe(deadlineWeight(-400));
    expect(deadlineWeight(-14)).toBeGreaterThan(deadlineWeight(-13));
  });

  it("shares one floor past the far horizon", () => {
    expect(deadlineWeight(120)).toBe(deadlineWeight(800));
    expect(deadlineWeight(120)).toBeLessThan(deadlineWeight(119));
  });

  it("equal days are equal weights, cost is irrelevant", () => {
    expect(deadlineWeight(14)).toBe(deadlineWeight(14));
    expect(deadlineWeight(0)).not.toBe(deadlineWeight(1));
  });

  it("rejects non-finite input with the floor", () => {
    expect(deadlineWeight(Number.NaN)).toBe(deadlineWeight(500));
    expect(deadlineWeight(Number.POSITIVE_INFINITY)).toBe(deadlineWeight(500));
    expect(deadlineWeight(Number.NEGATIVE_INFINITY)).toBe(deadlineWeight(500));
  });

  it("boundary days are strictly ordered", () => {
    for (const day of [-90, -1, 0, 1, 7, 8, 30, 31, 90, 91, 119, 120]) {
      expect(deadlineWeight(day)).toBeGreaterThan(0);
    }
    expect(deadlineWeight(-1)).toBeGreaterThan(deadlineWeight(0));
    expect(deadlineWeight(7)).toBeGreaterThan(deadlineWeight(8));
    expect(deadlineWeight(30)).toBeGreaterThan(deadlineWeight(31));
    expect(deadlineWeight(90)).toBeGreaterThan(deadlineWeight(91));
  });
});

describe("deadline area on the treemap", () => {
  const weights = [
    { id: "overdue", days: -10 },
    { id: "today", days: 0 },
    { id: "soon", days: 20 },
    { id: "far", days: 200 },
    { id: "also-far", days: 400 },
  ].map((i) => ({ id: i.id, value: deadlineWeight(i.days) }));

  it("flat areas follow closeness, and far items tie", () => {
    const rects = layoutFlat(weights, 800, 600);
    expect(area("overdue", rects)).toBeGreaterThan(area("today", rects));
    expect(area("today", rects)).toBeGreaterThan(area("soon", rects));
    expect(area("soon", rects)).toBeGreaterThan(area("far", rects));
    expect(area("far", rects)).toBeCloseTo(area("also-far", rects), 0);
  });

  it("a category with one close deadline outweighs a category of far items", () => {
    const rects = layoutOrdered(
      [
        { id: "docs", order: 0, children: [{ id: "passport", value: deadlineWeight(1), order: 0 }] },
        {
          id: "subs",
          order: 1,
          children: Array.from({ length: 8 }, (_, i) => ({
            id: `sub-${i}`,
            value: deadlineWeight(200),
            order: i,
          })),
        },
      ],
      900,
      600,
    );
    const docs = rects.find((g) => g.id === "docs")!;
    const subs = rects.find((g) => g.id === "subs")!;
    expect(docs.width * docs.height).toBeGreaterThan(subs.width * subs.height);
    expect(area("passport", docs.children)).toBeGreaterThan(
      area("sub-0", subs.children) * 8,
    );
  });

  it("same-day siblings get equal area even when values were equal", () => {
    const w = deadlineWeight(4);
    const rects = layoutFlat(
      [
        { id: "a", value: w },
        { id: "b", value: w },
        { id: "c", value: w },
      ],
      300,
      300,
    );
    const areas = ["a", "b", "c"].map((id) => area(id, rects));
    const spread = Math.max(...areas) / Math.min(...areas);
    expect(spread).toBeLessThan(1.05);
  });

  it("one item still fills the canvas", () => {
    const [r] = layoutFlat([{ id: "only", value: deadlineWeight(-40) }], 200, 80);
    expect(r.width).toBeCloseTo(200);
    expect(r.height).toBeCloseTo(80);
  });
});
