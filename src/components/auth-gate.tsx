import { createClient } from "@/lib/supabase/server";

/**
 * Server Component shell for authenticated content. Returns null for
 * anonymous visitors; pages render their own sign-in prompt instead.
 */
export async function AuthGate({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return <>{children}</>;
}
