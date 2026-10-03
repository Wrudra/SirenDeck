import { describe, expect, it } from "vitest";

import { layoutFlat, layoutGrouped } from "../map/treemap";

describe("layoutFlat", () => {
  it("returns empty for empty input or non-positive size", () => {
    expect(layoutFlat([], 100, 100)).toEqual([]);
    expect(layoutFlat([{ id: "a", value: 1 }], 0, 100)).toEqual([]);
    expect(layoutFlat([{ id: "a", value: 1 }], 100, -1)).toEqual([]);
  });

  it("tiles cover the canvas with no overlap", () => {
    const rects = layoutFlat(
      [
        { id: "a", value: 60 },
        { id: "b", value: 30 },
        { id: "c", value: 10 },
      ],
      400,
      300,
    );
    expect(rects).toHaveLength(3);
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(400 + 0.001);
      expect(r.y + r.height).toBeLessThanOrEqual(300 + 0.001);
    }
    // no pairwise overlap
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlaps =
          a.x < b.x + b.width &&
          b.x < a.x + a.width &&
          a.y < b.y + b.height &&
          b.y < a.y + a.height;
        expect(overlaps).toBe(false);
      }
    }
  });

  it("scales area proportionally to value", () => {
    const rects = layoutFlat(
      [
        { id: "big", value: 300 },
        { id: "small", value: 100 },
      ],
      400,
      400,
    );
    const big = rects.find((r) => r.id === "big")!;
    const small = rects.find((r) => r.id === "small")!;
    expect(big.width * big.height).toBeGreaterThan(small.width * small.height);
    const total = 400 * 400;
    expect((big.width * big.height) / total).toBeCloseTo(0.75, 1);
  });

  it("single node fills the canvas", () => {
    const [r] = layoutFlat([{ id: "only", value: 10 }], 200, 100);
    expect(r.width).toBeCloseTo(200);
    expect(r.height).toBeCloseTo(100);
  });
});

describe("layoutGrouped", () => {
  it("positions children relative to their group cell", () => {
    const groups = [
      {
        id: "g1",
        children: [
          { id: "a", value: 60 },
          { id: "b", value: 40 },
        ],
      },
      {
        id: "g2",
        children: [{ id: "c", value: 100 }],
      },
    ];
    const rects = layoutGrouped(groups, 400, 300);
    expect(rects).toHaveLength(2);

    for (const g of rects) {
      expect(g.children.length).toBeGreaterThan(0);
      for (const child of g.children) {
        expect(child.x).toBeGreaterThanOrEqual(0);
        expect(child.y).toBeGreaterThanOrEqual(0);
        // header band is reserved above children
        expect(child.y).toBeGreaterThanOrEqual(24 - 0.01);
        expect(child.x + child.width).toBeLessThanOrEqual(g.width + 0.01);
        expect(child.y + child.height).toBeLessThanOrEqual(g.height + 0.01);
      }
    }
  });

  it("bigger group gets more area", () => {
    const rects = layoutGrouped(
      [
        { id: "big", children: [{ id: "a", value: 300 }] },
        { id: "small", children: [{ id: "b", value: 100 }] },
      ],
      400,
      400,
    );
    const big = rects.find((g) => g.id === "big")!;
    const small = rects.find((g) => g.id === "small")!;
    expect(big.width * big.height).toBeGreaterThan(small.width * small.height);
  });

  it("returns empty for empty input", () => {
    expect(layoutGrouped([], 100, 100)).toEqual([]);
    expect(layoutGrouped([{ id: "g", children: [] }], 0, 100)).toEqual([]);
  });
});
