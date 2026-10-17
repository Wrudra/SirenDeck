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

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function getBlocksConfig(): BlocksRuntimeConfig {
  return {
    apiUrl: read("NEXT_PUBLIC_BLOCKS_API_URL"),
    appDomain: read("NEXT_PUBLIC_BLOCKS_APP_DOMAIN"),
    oidcClientId: read("NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID"),
    // SDK default scope when unset; not project-specific.
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
