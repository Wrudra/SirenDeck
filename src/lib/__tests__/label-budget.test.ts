import { describe, expect, it } from "vitest";

import { labelBudget, titleMonogram } from "../map/label-budget";

describe("labelBudget", () => {
  it("keeps name + days and drops cost on a short-but-wide Spotify tile", () => {
    // ~251×73 after Other packing — previously cramped with cost still on.
    const b = labelBudget(251, 73, "Spotify Family", true, true);
    expect(b).toMatchObject({
      showTitle: true,
      titleLines: 1,
      showTicker: true,
      showCost: false,
      showIcon: false,
      showMonogram: false,
    });
  });

  it("falls back to days-only when even one title line won't fit", () => {
    // ~165×53 at 1024×700 — title was clipping at the top.
    const b = labelBudget(165, 53, "Spotify Family", true, true);
    expect(b).toMatchObject({
      showTitle: false,
      showTicker: true,
      showCost: false,
      showIcon: false,
      showMonogram: false,
    });
  });

  it("clamps a wrapping title to one line before dropping it", () => {
    // Narrow Other/Travel passport cell: 2-line wrap needs more height than
    // a single clamped line + ticker.
    const b = labelBudget(123, 72, "Passport Renewal", true, true);
    expect(b.showTitle).toBe(true);
    expect(b.titleLines).toBe(1);
    expect(b.showTicker).toBe(true);
    expect(b.showCost).toBe(false);
  });

  it("shows ticker (not monogram) on a ~36px Other leaf", () => {
    const b = labelBudget(123, 37, "Namecheap Domain", true, true);
    expect(b.showTitle).toBe(false);
    expect(b.showTicker).toBe(true);
    expect(b.showMonogram).toBe(false);
  });

  it("uses a monogram when neither title nor ticker fits", () => {
    const b = labelBudget(28, 28, "Driver License", true, true);
    expect(b.showTitle).toBe(false);
    expect(b.showTicker).toBe(false);
    expect(b.showMonogram).toBe(true);
  });

  it("shows the full stack on a large tile", () => {
    const b = labelBudget(400, 300, "Health Insurance", true, true);
    expect(b).toMatchObject({
      showTitle: true,
      showTicker: true,
      showDate: true,
      showCost: true,
      showIcon: true,
      showMonogram: false,
    });
  });
});

describe("titleMonogram", () => {
  it("picks the first alphanumeric, uppercased", () => {
    expect(titleMonogram("Spotify Family")).toBe("S");
    expect(titleMonogram("  42-pass")).toBe("4");
    expect(titleMonogram("***")).toBe("?");
  });
});
