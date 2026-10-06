import { NextResponse, type NextRequest } from "next/server";

import { getAuthProviderPreference } from "@/lib/blocks/config";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Blocks-only deploys have no Supabase env; skip session refresh.
  if (getAuthProviderPreference() === "blocks") {
    return NextResponse.next({ request });
  }
  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (static assets)
     * - favicon.ico (static file)
     * - api/auth (auth endpoints manage their own cookies)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
