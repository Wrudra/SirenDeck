import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers. Reads the auth cookies set by the browser client.
 * Always call inside a request scope · never at module top level.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render · safe to ignore when the
          // middleware refreshes sessions (documented @supabase/ssr pattern).
        }
      },
    },
  });
}
