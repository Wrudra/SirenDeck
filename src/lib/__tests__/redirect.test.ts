import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/auth/redirect";

describe("safeNextPath", () => {
  it("keeps a normal in-app path", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app?view=map")).toBe("/app?view=map");
    expect(safeNextPath(null)).toBe("/");
  });

  it("rejects off-site and scheme-relative targets", () => {
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("/\r\nhttps://evil.example")).toBe("/");
  });
});
