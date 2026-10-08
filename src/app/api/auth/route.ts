import { type NextRequest, NextResponse } from "next/server";

import { authCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

const SIGN_IN_ERROR = "Email or password is incorrect.";
const SIGN_UP_ERROR = "Could not create that account. If you already have one, sign in.";

function emailOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/**
 * Sign in or sign up with email and password.
 * Confirmation emails use the configured site origin, never the request host.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const mode = new URL(request.url).searchParams.get("mode");
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let redirectTo: string;
  try {
    redirectTo = authCallbackUrl();
  } catch {
    return NextResponse.json(
      { error: "Sign-in is not configured. Set NEXT_PUBLIC_SITE_URL." },
      { status: 500 },
    );
  }

  const supabase = await createClient();

  const email = emailOf(body.email);
  if (!email) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 });
  }

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      return NextResponse.json({ error: SIGN_UP_ERROR }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      needsConfirmation: !data.session,
    });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: SIGN_IN_ERROR }, { status: 401 });
  }
  return NextResponse.json({ ok: true, needsConfirmation: false });
}
