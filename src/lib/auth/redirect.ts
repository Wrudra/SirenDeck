/**
 * Public origin used in auth emails and post-login redirects.
 * Never taken from the request Host header.
 * Development falls back to the local Supabase site_url when unset.
 */
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (raw) return new URL(raw).origin;
  if (process.env.NODE_ENV === "development") return "http://127.0.0.1:3000";
  throw new Error("Set NEXT_PUBLIC_SITE_URL to this app's public origin.");
}

/** Auth email and OAuth return path. */
export function authCallbackUrl(): string {
  return `${getSiteOrigin()}/auth/callback`;
}

/**
 * Post-login path. A single-slash relative path only.
 * Scheme-relative, backslash, and control-character values become "/".
 */
export function safeNextPath(nextParam: string | null | undefined): string {
  if (!nextParam) return "/";
  if (!nextParam.startsWith("/") || nextParam.startsWith("//") || nextParam.startsWith("/\\")) {
    return "/";
  }
  if (/[\u0000-\u001F\u007F\\]/.test(nextParam)) return "/";

  let url: URL;
  try {
    url = new URL(nextParam, "http://sirendeck.local");
  } catch {
    return "/";
  }
  if (url.origin !== "http://sirendeck.local") return "/";
  if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return "/";
  return `${url.pathname}${url.search}`;
}
