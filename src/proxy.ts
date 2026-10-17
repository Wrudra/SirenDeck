import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Blocks-only: auth is hosted OIDC in the browser; no server session middleware.
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
