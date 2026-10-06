/**
 * Public Blocks runtime config for the browser SDK.
 * Values prefer NEXT_PUBLIC_* env; fall back to known public project defaults
 * so a blank Docker build-arg / missing inline cannot leave login "not configured".
 * Never put a client secret here.
 */

export type BlocksRuntimeConfig = {
  apiUrl: string;
  appDomain: string;
  oidcClientId: string;
  oidcScope: string;
  oidcUrl: string;
  xBlocksKey: string;
};

/** Public, non-secret defaults for SirenDeck Blocks `dev` (same as .env.example). */
const PUBLIC_DEFAULTS = {
  apiUrl: "https://blocksapi.slsblx.com",
  appDomain: "https://dblcyi-eocee.slsblx.com",
  oidcClientId: "e6307866-2c00-42c3-b94d-d63c6581c9ed",
  oidcScope: "openid profile",
  oidcUrl: "https://iam.seliseblocks.com/D158bd535e4d44ea58e5c53146704e2ab",
  xBlocksKey: "D158bd535e4d44ea58e5c53146704e2ab",
} as const;

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getBlocksConfig(): BlocksRuntimeConfig {
  return {
    apiUrl: read("NEXT_PUBLIC_BLOCKS_API_URL") || PUBLIC_DEFAULTS.apiUrl,
    appDomain: read("NEXT_PUBLIC_BLOCKS_APP_DOMAIN") || PUBLIC_DEFAULTS.appDomain,
    oidcClientId: read("NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID") || PUBLIC_DEFAULTS.oidcClientId,
    oidcScope: read("NEXT_PUBLIC_BLOCKS_OIDC_SCOPE") || PUBLIC_DEFAULTS.oidcScope,
    oidcUrl: read("NEXT_PUBLIC_BLOCKS_OIDC_URL") || PUBLIC_DEFAULTS.oidcUrl,
    xBlocksKey: read("NEXT_PUBLIC_BLOCKS_KEY") || PUBLIC_DEFAULTS.xBlocksKey,
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
