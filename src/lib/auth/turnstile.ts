/** Cloudflare's published test key. Always passes, and only in local development. */
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export function turnstileSiteKey(): string {
  const configured = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return TEST_SITE_KEY;
  return "";
}

function turnstileSecret(): string {
  const configured = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") return TEST_SECRET;
  return "";
}

/** Confirms the widget token with Cloudflare before any auth call. */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = turnstileSecret();
  if (!secret || !token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  if (!res.ok) return false;

  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
