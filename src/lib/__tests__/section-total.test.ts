import { describe, expect, it } from "vitest";

import {
  fitSectionTotal,
  formatSectionTotal,
  formatSectionTotalCompact,
} from "../map/section-total";

const nbsp = (s: string) => s.replace(/\u00a0/g, " ");

describe("section totals", () => {
  const bdt = [{ currency: "BDT" as const, total: 242_000 }];
  const mixed = [
    { currency: "BDT" as const, total: 6000 },
    { currency: "USD" as const, total: 120 },
  ];

  it("formats like the ledger, joining currencies", () => {
    expect(nbsp(formatSectionTotal(bdt))).toBe("BDT 242,000");
    expect(nbsp(formatSectionTotal(mixed))).toBe("BDT 6,000 + $120");
    expect(nbsp(formatSectionTotalCompact(bdt))).toBe("BDT 242K");
    expect(nbsp(formatSectionTotalCompact([{ currency: "BDT", total: 56_400 }]))).toBe("BDT 56K");
    expect(nbsp(formatSectionTotalCompact([{ currency: "USD", total: 2300 }]))).toBe("$2.3K");
  });

  it("shows the full figure on wide bars", () => {
    expect(nbsp(fitSectionTotal(400, "Insurance", bdt)!)).toBe("BDT 242,000");
  });

  it("falls back to compact, then hides, as the bar narrows", () => {
    // name ≈ 9×7.6+12 ≈ 80px, chrome 24px → full (11 chars ≈ 74px) needs ~178px
    expect(nbsp(fitSectionTotal(165, "Insurance", bdt)!)).toBe("BDT 242K");
    expect(fitSectionTotal(120, "Insurance", bdt)).toBeNull();
    expect(fitSectionTotal(0, "Insurance", bdt)).toBeNull();
  });

  it("never shows a total for a section with no priced items", () => {
    expect(fitSectionTotal(800, "Docs", [])).toBeNull();
  });
});
