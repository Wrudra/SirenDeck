import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
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
