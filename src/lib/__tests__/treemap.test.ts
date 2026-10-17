import { describe, expect, it } from "vitest";

import {
  OTHER_GROUP_ID,
  layoutFlat,
  layoutGrouped,
  layoutGroupedReadable,
  layoutOrdered,
  layoutOrderedFlat,
} from "../map/treemap";

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

describe("layoutGroupedReadable", () => {
  // Mirrors the live board: two big categories, a few mid, two tiny.
  const board = [
    { id: "insurance", children: [{ id: "health", value: 156000 }, { id: "auto", value: 86000 }] },
    { id: "bills", children: [{ id: "power", value: 114000 }, { id: "fiber", value: 54000 }] },
    {
      id: "subs",
      children: [
        { id: "adobe", value: 24000 },
        { id: "netflix", value: 21600 },
        { id: "spotify", value: 10800 },
      ],
    },
    { id: "travel", children: [{ id: "passport", value: 12000 }] },
    { id: "domains", children: [{ id: "namecheap", value: 1800 }] },
    { id: "licenses", children: [{ id: "driver", value: 500 }] },
  ];
  const opts = { paddingInner: 3, headerHeight: 22, minGroupWidth: 96 };

  it("plain layout really does produce slivers for this board", () => {
    const rects = layoutGrouped(board, 1440, 670, opts);
    expect(Math.min(...rects.map((r) => r.width))).toBeLessThan(96);
  });

  it("folds tiny categories into Other without enlarging them past the big ones", () => {
    const { rects, otherMembers } = layoutGroupedReadable(board, 1440, 670, opts);
    expect(otherMembers.sort()).toEqual(["domains", "licenses"]);
    const other = rects.find((r) => r.id === OTHER_GROUP_ID)!;
    expect(other.children.map((c) => c.id).sort()).toEqual(["driver", "namecheap"]);
    const insurance = rects.find((r) => r.id === "insurance")!;
    expect(insurance.width * insurance.height).toBeGreaterThan(other.width * other.height);
    expect(rects.map((r) => r.id)).toEqual(expect.arrayContaining(["insurance", "bills"]));
  });

  it("keeps every item exactly once", () => {
    const { rects } = layoutGroupedReadable(board, 1024, 470, opts);
    const ids = rects.flatMap((r) => r.children.map((c) => c.id)).sort();
    expect(ids).toEqual(board.flatMap((g) => g.children.map((c) => c.id)).sort());
  });

  it("a lone small category keeps its own id and stays smaller", () => {
    const { rects, otherMembers } = layoutGroupedReadable(
      [
        { id: "big", children: [{ id: "a", value: 1000 }] },
        { id: "tiny", children: [{ id: "b", value: 5 }] },
      ],
      800,
      400,
      opts,
    );
    expect(otherMembers).toEqual([]);
    const tiny = rects.find((r) => r.id === "tiny")!;
    const big = rects.find((r) => r.id === "big")!;
    expect(big.width * big.height).toBeGreaterThan(tiny.width * tiny.height * 5);
  });

  it("folded leaves keep their relative size", () => {
    const { rects, otherMembers } = layoutGroupedReadable(board, 1024, 470, opts);
    expect(otherMembers.sort()).toEqual(["domains", "licenses"]);
    const byId = new Map(
      rects.flatMap((r) => r.children.map((c) => [c.id, c.width * c.height] as const)),
    );
    expect(byId.get("passport")!).toBeGreaterThan(byId.get("namecheap")!);
    expect(byId.get("namecheap")!).toBeGreaterThan(byId.get("driver")!);
  });

  it("leaves a balanced board untouched", () => {
    const groups = [
      { id: "g1", children: [{ id: "a", value: 50 }] },
      { id: "g2", children: [{ id: "b", value: 50 }] },
    ];
    expect(layoutGroupedReadable(groups, 800, 400, opts).rects).toEqual(
      layoutGrouped(groups, 800, 400, opts),
    );
  });
});

describe("layoutOrdered", () => {
  it("places categories left to right and items top to bottom", () => {
    const rects = layoutOrdered(
      [
        {
          id: "later",
          order: 1,
          children: [
            { id: "far", value: 1, order: 1 },
            { id: "near", value: 2, order: 0 },
          ],
        },
        {
          id: "sooner",
          order: 0,
          children: [{ id: "now", value: 3, order: 0 }],
        },
      ],
      900,
      600,
      { paddingInner: 4, headerHeight: 22 },
    );
    const sooner = rects.find((g) => g.id === "sooner")!;
    const later = rects.find((g) => g.id === "later")!;
    expect(sooner.x).toBeLessThan(later.x);
    expect(sooner.width).toBeGreaterThan(later.width);
    const near = later.children.find((c) => c.id === "near")!;
    const far = later.children.find((c) => c.id === "far")!;
    expect(near.y).toBeLessThan(far.y);
    expect(near.height).toBeGreaterThan(far.height);
    expect(near.width).toBeCloseTo(far.width, 0);
  });

  it("keeps a far sibling at least a third as tall as the soonest", () => {
    const [group] = layoutOrdered(
      [
        {
          id: "bills",
          order: 0,
          children: [
            { id: "old", value: 3, order: 0 },
            { id: "far", value: 1, order: 1 },
          ],
        },
      ],
      400,
      600,
      { headerHeight: 22 },
    );
    const old = group.children.find((c) => c.id === "old")!;
    const far = group.children.find((c) => c.id === "far")!;
    expect(old.height / far.height).toBeLessThan(3.2);
    expect(far.height).toBeGreaterThan(80);
  });

  it("stacks a zoomed category with the soonest on top", () => {
    const rects = layoutOrderedFlat(
      [
        { id: "second", value: 2, order: 1 },
        { id: "first", value: 3, order: 0 },
      ],
      500,
      400,
      2,
    );
    const first = rects.find((r) => r.id === "first")!;
    const second = rects.find((r) => r.id === "second")!;
    expect(first.y).toBeLessThan(second.y);
    expect(first.height).toBeGreaterThan(second.height);
  });
});
