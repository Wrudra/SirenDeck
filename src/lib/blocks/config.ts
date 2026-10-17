/**
 * Public Blocks runtime config for the browser SDK.
 * Values come from NEXT_PUBLIC_* env (local `.env.local` or Blocks Release
 * build-args / runtime secrets). Do not hardcode project key, client id,
 * or tenant URLs here — those belong in env / Release secrets, not source.
 * Never put a client secret here (this app uses a public PKCE client).
 */

export type BlocksRuntimeConfig = {
  apiUrl: string;
  appDomain: string;
  oidcClientId: string;
  oidcScope: string;
  oidcUrl: string;
  xBlocksKey: string;
};

export function getBlocksConfig(): BlocksRuntimeConfig {
  return {
    // Literal process.env.NEXT_PUBLIC_* references are required: Next.js
    // inlines them into the client bundle at build time; dynamic lookups
    // like process.env[name] are undefined in the browser.
    apiUrl: (process.env.NEXT_PUBLIC_BLOCKS_API_URL ?? "").trim(),
    appDomain: (process.env.NEXT_PUBLIC_BLOCKS_APP_DOMAIN ?? "").trim(),
    oidcClientId: (process.env.NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID ?? "").trim(),
    // SDK default scope when unset; not project-specific.
    oidcScope: (process.env.NEXT_PUBLIC_BLOCKS_OIDC_SCOPE ?? "").trim() || "openid profile",
    oidcUrl: (process.env.NEXT_PUBLIC_BLOCKS_OIDC_URL ?? "").trim(),
    xBlocksKey: (process.env.NEXT_PUBLIC_BLOCKS_KEY ?? "").trim(),
  };
}

/** True when the minimum public values for hosted OIDC login are present. */
export function isBlocksLoginConfigured(): boolean {
  const c = getBlocksConfig();
  return Boolean(c.apiUrl && c.oidcUrl && c.oidcClientId && c.xBlocksKey);
}
