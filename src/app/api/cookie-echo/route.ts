import type { NextRequest } from "next/server";

// TEMP local-debug route: lists cookie names the browser sends. Delete after use.
export function GET(request: NextRequest) {
  const names = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((c) => c.split("=")[0]?.trim())
    .filter(Boolean);
  return Response.json({ cookieNames: names });
}
