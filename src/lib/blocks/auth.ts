"use client";

import { getBlocksClient } from "./client";
import { clearCachedTokens, getCachedAccessToken, setCachedTokens } from "./auth-token";
import { isBlocksLoginConfigured } from "./config";

const RETURN_TO_KEY = "sirendeck.blocks.returnTo";

export type SessionClaims = Record<string, unknown> | null;

export async function startLogin(returnTo = "/app"): Promise<void> {
  if (!isBlocksLoginConfigured()) {
    throw new Error("Login is not configured. Set NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID in .env.local.");
  }
  if (typeof window !== "undefined") {
    sessionStorage.setItem(RETURN_TO_KEY, returnTo.startsWith("/") ? returnTo : "/app");
  }
  await getBlocksClient().auth.idp.redirectToProvider();
}

export async function completeLogin(callbackUrl: string): Promise<
  | { ok: true; returnTo: string }
  | { ok: false; message: string }
> {
  const returnTo =
    (typeof window !== "undefined" ? sessionStorage.getItem(RETURN_TO_KEY) : null) ?? "/app";
  if (typeof window !== "undefined") sessionStorage.removeItem(RETURN_TO_KEY);

  try {
    const data = await getBlocksClient().auth.idp.callback(callbackUrl);
    const err = (data as { error?: string; error_description?: string }).error;
    if (err) {
      const desc = (data as { error_description?: string }).error_description;
      return { ok: false, message: desc || err };
    }
    // Cookie flow usually returns no tokens; if body has them, cache for bearer mode.
    const access =
      (data as { access_token?: string; accessToken?: string }).access_token ??
      (data as { accessToken?: string }).accessToken;
    const refresh =
      (data as { refresh_token?: string; refreshToken?: string }).refresh_token ??
      (data as { refreshToken?: string }).refreshToken;
    if (typeof access === "string") {
      setCachedTokens(access, typeof refresh === "string" ? refresh : undefined);
    }
    return { ok: true, returnTo: returnTo.startsWith("/") ? returnTo : "/app" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Login callback failed.",
    };
  }
}

export async function fetchSessionClaims(): Promise<SessionClaims> {
  try {
    const info = await getBlocksClient().auth.userInfo();
    return (info ?? null) as SessionClaims;
  } catch {
    // Cookie-only sessions: userInfo failure means unauthenticated.
    if (!getCachedAccessToken()) return null;
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await getBlocksClient().auth.logout();
  } catch {
    // Best-effort; always clear local state.
  }
  clearCachedTokens();
}
