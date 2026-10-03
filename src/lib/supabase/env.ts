/**
 * Resolves Supabase URL and publishable key from environment variables.
 * Supports both Vercel Marketplace integration naming and manual .env naming.
 * Resolution is lazy: missing config throws when a client is created, so
 * `next build` still succeeds in environments without env vars.
 */
function requireEnv(
  value: string | undefined,
  candidates: readonly string[],
  label: string,
): string {
  if (value) return value;
  throw new Error(
    `Missing Supabase ${label}. Set one of: ${candidates.join(" or ")}`,
  );
}

export function getSupabaseUrl(): string {
  return requireEnv(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
    "project URL",
  );
}

export function getSupabasePublishableKey(): string {
  return requireEnv(
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    "publishable API key",
  );
}

