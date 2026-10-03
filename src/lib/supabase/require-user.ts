import { redirect } from "next/navigation";

import { createClient } from "./server";

/**
 * Guard for the protected /app layout. Redirects signed-out users to /login.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { user, supabase };
}
