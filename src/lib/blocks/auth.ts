"use client";

import { getBlocksClient } from "./client";
import { clearCachedTokens, getCachedAccessToken, setCachedTokens } from "./auth-token";
import { getBlocksConfig, isBlocksLoginConfigured } from "./config";

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

/**
 * Hosted signup entry. The SDK's idp.initiate drops unknown params, so the
 * flow=signup call goes straight to the gateway (same endpoint, same public
 * x-blocks-key header the SDK itself sends). The gateway returns the hosted
 * signup URL with fresh state/nonce, which we then navigate to.
 */
export async function startSignup(returnTo = "/app"): Promise<void> {
  const c = getBlocksConfig();
  if (!isBlocksLoginConfigured()) {
    throw new Error("Login is not configured. Set NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID in .env.local.");
  }
  if (typeof window !== "undefined") {
    sessionStorage.setItem(RETURN_TO_KEY, returnTo.startsWith("/") ? returnTo : "/app");
  }
  const params = new URLSearchParams({
    clientId: c.oidcClientId,
    redirectUri: `${window.location.origin}/login/callback`,
    flow: "signup",
  });
  const res = await fetch(`${c.apiUrl}/iam/v4/idp/initiate?${params}`, {
    headers: { "x-blocks-key": c.xBlocksKey },
  });
  if (!res.ok) {
    throw new Error("Could not start signup. Try again in a moment.");
  }
  const data = (await res.json()) as { redirect_uri?: string; redirectUri?: string };
  const url = data.redirect_uri ?? data.redirectUri;
  if (!url) {
    throw new Error("Signup is unavailable — the identity service did not return a signup URL.");
  }
  window.location.assign(url);
}

function extractTokens(payload: unknown): { access?: string; refresh?: string } {
  const pick = (obj: Record<string, unknown>) => ({
    access:
      (obj.access_token as string | undefined) ?? (obj.accessToken as string | undefined),
    refresh:
      (obj.refresh_token as string | undefined) ?? (obj.refreshToken as string | undefined),
  });
  const top = pick((payload ?? {}) as Record<string, unknown>);
  if (top.access) return top;
  for (const key of ["data", "result"]) {
    const nested = (payload as Record<string, unknown>)?.[key];
    if (nested && typeof nested === "object") {
      const found = pick(nested as Record<string, unknown>);
      if (found.access) return found;
    }
  }
  return top;
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
    const { access, refresh } = extractTokens(data);
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
