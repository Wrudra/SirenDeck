import type { NextRequest } from "next/server";

/**
 * Local-dev gateway proxy. The Blocks gateway only sends CORS headers for the
 * deployed app origin, so plain http://localhost:3000 cannot call it directly.
 * Pointing NEXT_PUBLIC_BLOCKS_API_URL at this same-origin path (plus
 * BLOCKS_GATEWAY_URL for the real upstream) routes every SDK call through the
 * Next server, where CORS does not apply. The proxy also rewrites session
 * cookies onto localhost (strips Domain/Secure, forces SameSite=Lax) so the
 * cookie-based hosted login works over plain HTTP.
 *
 * Only active when NEXT_PUBLIC_BLOCKS_API_URL points here; production keeps
 * the real gateway URL and never hits this route.
 */

// Hop-by-hop / recomputed headers we must not copy blindly.
const STRIP_REQ_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "content-length",
  "transfer-encoding",
  "upgrade",
]);
const STRIP_RES_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "content-encoding",
]);

/** Rewrite one Set-Cookie so it sticks on localhost over plain HTTP. */
function localizeCookie(cookie: string): string {
  return cookie
    .split(/;\s*/)
    .filter((attr) => {
      const lower = attr.toLowerCase();
      return !lower.startsWith("domain=") && lower !== "secure" && lower !== "samesite=none";
    })
    .concat("SameSite=Lax")
    .join("; ");
}

async function proxy(request: NextRequest, ctx: RouteContext<"/blocks-gw/[...path]">) {
  const base = (process.env.BLOCKS_GATEWAY_URL ?? "").replace(/\/+$/, "");
  if (!base) {
    return Response.json(
      { error: "BLOCKS_GATEWAY_URL is not set; add it to .env.local for local dev." },
      { status: 500 },
    );
  }
  const { path } = await ctx.params;
  const target = `${base}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP_REQ_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RES_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
      resHeaders.set(key, value);
    }
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    resHeaders.append("set-cookie", localizeCookie(cookie));
  }
  return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
}

export const dynamic = "force-dynamic";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
