/**
 * Public Blocks runtime config for the browser SDK.
 * Values come from NEXT_PUBLIC_* (see .env.example). Never put a client secret here.
 */

export type BlocksRuntimeConfig = {
  apiUrl: string;
  appDomain: string;
  oidcClientId: string;
  oidcScope: string;
  oidcUrl: string;
  xBlocksKey: string;
};

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getBlocksConfig(): BlocksRuntimeConfig {
  return {
    apiUrl: read("NEXT_PUBLIC_BLOCKS_API_URL"),
    appDomain: read("NEXT_PUBLIC_BLOCKS_APP_DOMAIN") || "https://dblcyi-eocee.slsblx.com",
    oidcClientId: read("NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID"),
    oidcScope: read("NEXT_PUBLIC_BLOCKS_OIDC_SCOPE") || "openid profile",
    oidcUrl: read("NEXT_PUBLIC_BLOCKS_OIDC_URL"),
    xBlocksKey: read("NEXT_PUBLIC_BLOCKS_KEY"),
  };
}

/** True when the minimum public values for hosted OIDC login are present. */
export function isBlocksLoginConfigured(): boolean {
  const c = getBlocksConfig();
  return Boolean(c.apiUrl && c.oidcUrl && c.oidcClientId && c.xBlocksKey);
}

/**
 * Auth surface selector for the dual-run period on `dev`.
 * - `blocks` (default when Blocks env is complete): hosted OIDC is primary
 * - `supabase`: keep legacy email/password form as primary
 */
export function getAuthProviderPreference(): "blocks" | "supabase" {
  const raw = read("NEXT_PUBLIC_AUTH_PROVIDER").toLowerCase();
  if (raw === "supabase") return "supabase";
  if (raw === "blocks") return "blocks";
  return isBlocksLoginConfigured() ? "blocks" : "supabase";
}
