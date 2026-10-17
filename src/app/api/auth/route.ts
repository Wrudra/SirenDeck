import { type NextRequest, NextResponse } from "next/server";

import { authCallbackUrl } from "@/lib/auth/redirect";
import { verifyTurnstile } from "@/lib/auth/turnstile";
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
  let body: { email?: unknown; password?: unknown; turnstileToken?: unknown };
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
  if (mode === "signup" && password.length < 10) {
    return NextResponse.json({ error: "Use at least 10 characters." }, { status: 400 });
  }

  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!(await verifyTurnstile(turnstileToken))) {
    return NextResponse.json({ error: "Confirm you are human, then try again." }, { status: 400 });
  }

  const { data: allowed, error: limitError } = await supabase.rpc("consume_auth_attempt", {
    p_email: email,
  });
  if (limitError) {
    return NextResponse.json({ error: "Sign-in is not available right now." }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 },
    );
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
    // A session means the account is usable now, so no email was sent.
    // A new unconfirmed user has an identity. An existing address comes back
    // with an empty identity list and no message, so don't claim one was sent.
    const emailSent = !data.session && (data.user?.identities?.length ?? 0) > 0;
    const status = data.session ? "signed-in" : emailSent ? "email-sent" : "no-email";
    return NextResponse.json({ ok: true, status });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: SIGN_IN_ERROR }, { status: 401 });
  }
  return NextResponse.json({ ok: true, status: "signed-in" });
}
