"use client";

import { isJwtExpired } from "./jwt";

let cachedAccessToken: string | undefined;
let cachedRefreshToken: string | undefined;
let refreshInFlight: Promise<string | undefined> | null = null;

export function getCachedAccessToken(): string | undefined {
  if (cachedAccessToken && !isJwtExpired(cachedAccessToken)) return cachedAccessToken;
  return undefined;
}

export function setCachedTokens(access?: string, refresh?: string) {
  if (access) cachedAccessToken = access;
  if (refresh) cachedRefreshToken = refresh;
}

export function clearCachedTokens() {
  cachedAccessToken = undefined;
  cachedRefreshToken = undefined;
}

/** Used by onUnauthorized; no-op when cookie-only (no refresh token cached). */
export async function refreshAccessToken(): Promise<string | undefined> {
  if (!cachedRefreshToken) return undefined;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const { getBlocksClient } = await import("./client");
      const client = getBlocksClient();
      const res = await client.auth.oidc.refreshToken({ refreshToken: cachedRefreshToken! });
      const access =
        (res as { access_token?: string; accessToken?: string }).access_token ??
        (res as { accessToken?: string }).accessToken;
      const refresh =
        (res as { refresh_token?: string; refreshToken?: string }).refresh_token ??
        (res as { refreshToken?: string }).refreshToken;
      if (typeof access === "string") setCachedTokens(access, typeof refresh === "string" ? refresh : undefined);
      return typeof access === "string" ? access : undefined;
    } catch {
      clearCachedTokens();
      return undefined;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}
