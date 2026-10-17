"use client";

import { isJwtExpired } from "./jwt";

/**
 * Token cache for the hosted IdP flow. IAM's callback returns tokens in the
 * body rather than as cookies, so the app layer must store them; localStorage
 * keeps the session across reloads (module memory alone dies on navigation).
 */
const ACCESS_KEY = "sirendeck.blocks.access";
const REFRESH_KEY = "sirendeck.blocks.refresh";

let cachedAccessToken: string | undefined;
let cachedRefreshToken: string | undefined;

function readStored(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key: string, value: string | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode etc.) — memory cache still works.
  }
}

export function getCachedAccessToken(): string | undefined {
  const token = cachedAccessToken ?? readStored(ACCESS_KEY);
  cachedAccessToken = token;
  if (token && !isJwtExpired(token)) return token;
  return undefined;
}

function getCachedRefreshToken(): string | undefined {
  cachedRefreshToken = cachedRefreshToken ?? readStored(REFRESH_KEY);
  return cachedRefreshToken;
}

export function setCachedTokens(access?: string, refresh?: string) {
  if (access) {
    cachedAccessToken = access;
    writeStored(ACCESS_KEY, access);
  }
  if (refresh) {
    cachedRefreshToken = refresh;
    writeStored(REFRESH_KEY, refresh);
  }
}

export function clearCachedTokens() {
  cachedAccessToken = undefined;
  cachedRefreshToken = undefined;
  writeStored(ACCESS_KEY, undefined);
  writeStored(REFRESH_KEY, undefined);
}

let refreshInFlight: Promise<string | undefined> | null = null;

/** Used by onUnauthorized; no-op when no refresh token was stored. */
export async function refreshAccessToken(): Promise<string | undefined> {
  const refreshToken = getCachedRefreshToken();
  if (!refreshToken) return undefined;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const { getBlocksClient } = await import("./client");
      const client = getBlocksClient();
      const res = await client.auth.oidc.refreshToken({ refreshToken });
      const access =
        (res as { access_token?: string; accessToken?: string }).access_token ??
        (res as { accessToken?: string }).accessToken;
      const nextRefresh =
        (res as { refresh_token?: string; refreshToken?: string }).refresh_token ??
        (res as { refreshToken?: string }).refreshToken;
      if (typeof access === "string") {
        setCachedTokens(access, typeof nextRefresh === "string" ? nextRefresh : undefined);
        return access;
      }
      return undefined;
    } catch {
      clearCachedTokens();
      return undefined;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

