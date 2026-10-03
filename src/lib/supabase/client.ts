import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Browser-side Supabase client. Reuses one instance per tab (Supabase Auth
 * stores the session in cookies, safe for SSR + client navigation).
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
