import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Sign in or sign up with email + password, called from the login/signup forms.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const origin = new URL(request.url).origin;

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } =
    mode === "signup"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback` },
        })
      : { data: null, error: (await supabase.auth.signInWithPassword({ email, password })).error };

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // When "Confirm email" is enabled, signUp succeeds without a session.
  return NextResponse.json({
    ok: true,
    needsConfirmation: mode === "signup" && !data?.session,
  });
}
