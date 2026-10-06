"use client";

import { createBlocksClient } from "@seliseblocks/client";

import { getBlocksConfig, isBlocksLoginConfigured } from "./config";
import { getCachedAccessToken, refreshAccessToken } from "./auth-token";

/**
 * Single shared Blocks client for the browser. Cookie-based hosted login uses
 * credentials:include; optional bearer tokens are resolved via auth-token helpers.
 */
function buildClient() {
  const cfg = getBlocksConfig();
  if (!isBlocksLoginConfigured()) {
    throw new Error(
      "Blocks login is not configured. Set NEXT_PUBLIC_BLOCKS_API_URL, NEXT_PUBLIC_BLOCKS_OIDC_URL, NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID, and NEXT_PUBLIC_BLOCKS_KEY.",
    );
  }
  return createBlocksClient({
    apiUrl: cfg.apiUrl,
    appDomain: cfg.appDomain,
    xBlocksKey: cfg.xBlocksKey,
    accessToken: () => getCachedAccessToken(),
    onUnauthorized: () => refreshAccessToken(),
    oidc: {
      clientId: cfg.oidcClientId,
      scope: cfg.oidcScope,
      url: cfg.oidcUrl,
      // Default SDK redirect is `${origin}/login/callback` — keep that contract.
    },
  });
}

let singleton: ReturnType<typeof createBlocksClient> | null = null;

export function getBlocksClient() {
  if (!singleton) singleton = buildClient();
  return singleton;
}
