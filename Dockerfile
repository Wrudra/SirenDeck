# SirenDeck — Blocks Release / kaniko (pnpm + Next standalone)
#
# Public NEXT_PUBLIC_* values are NOT baked into this file.
# Blocks Release injects them as build-args (and runtime secrets) via
# `blocks release secrets sync`. Empty pipeline --build-arg values will
# blank the client bundle — keep Release secrets non-empty, or the
# builder stage fails the preflight check below.
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --allow-build=unrs-resolver --allow-build=sharp
COPY . .

# Accept public env from Blocks Release build-args (no project literals here).
ARG NEXT_PUBLIC_BLOCKS_KEY=
ARG NEXT_PUBLIC_BLOCKS_API_URL=
ARG NEXT_PUBLIC_BLOCKS_OIDC_URL=
ARG NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=
ARG NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=
ARG NEXT_PUBLIC_BLOCKS_APP_DOMAIN=
ARG NEXT_PUBLIC_AUTH_PROVIDER=blocks
ARG NEXT_PUBLIC_DATA_PROVIDER=blocks

ENV NEXT_PUBLIC_BLOCKS_KEY=$NEXT_PUBLIC_BLOCKS_KEY \
    NEXT_PUBLIC_BLOCKS_API_URL=$NEXT_PUBLIC_BLOCKS_API_URL \
    NEXT_PUBLIC_BLOCKS_OIDC_URL=$NEXT_PUBLIC_BLOCKS_OIDC_URL \
    NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=$NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID \
    NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=$NEXT_PUBLIC_BLOCKS_OIDC_SCOPE \
    NEXT_PUBLIC_BLOCKS_APP_DOMAIN=$NEXT_PUBLIC_BLOCKS_APP_DOMAIN \
    NEXT_PUBLIC_AUTH_PROVIDER=$NEXT_PUBLIC_AUTH_PROVIDER \
    NEXT_PUBLIC_DATA_PROVIDER=$NEXT_PUBLIC_DATA_PROVIDER \
    NEXT_TELEMETRY_DISABLED=1

# Fail fast if Release passed empty build-args (would ship a broken login CTA).
RUN test -n "$NEXT_PUBLIC_BLOCKS_KEY" \
 && test -n "$NEXT_PUBLIC_BLOCKS_API_URL" \
 && test -n "$NEXT_PUBLIC_BLOCKS_OIDC_URL" \
 && test -n "$NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID" \
 && pnpm run build \
 && ls -la .next/standalone \
 && (test -f .next/standalone/server.js || test -f .next/standalone/sirendeck/server.js)

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Runtime copies of the same public names (SSR). Client bundle already
# inlined them at build time from the builder-stage ENV above.
ARG NEXT_PUBLIC_BLOCKS_KEY=
ARG NEXT_PUBLIC_BLOCKS_API_URL=
ARG NEXT_PUBLIC_BLOCKS_OIDC_URL=
ARG NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=
ARG NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=
ARG NEXT_PUBLIC_BLOCKS_APP_DOMAIN=
ARG NEXT_PUBLIC_AUTH_PROVIDER=blocks
ARG NEXT_PUBLIC_DATA_PROVIDER=blocks

ENV NEXT_PUBLIC_BLOCKS_KEY=$NEXT_PUBLIC_BLOCKS_KEY \
    NEXT_PUBLIC_BLOCKS_API_URL=$NEXT_PUBLIC_BLOCKS_API_URL \
    NEXT_PUBLIC_BLOCKS_OIDC_URL=$NEXT_PUBLIC_BLOCKS_OIDC_URL \
    NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=$NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID \
    NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=$NEXT_PUBLIC_BLOCKS_OIDC_SCOPE \
    NEXT_PUBLIC_BLOCKS_APP_DOMAIN=$NEXT_PUBLIC_BLOCKS_APP_DOMAIN \
    NEXT_PUBLIC_AUTH_PROVIDER=$NEXT_PUBLIC_AUTH_PROVIDER \
    NEXT_PUBLIC_DATA_PROVIDER=$NEXT_PUBLIC_DATA_PROVIDER

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
CMD ["sh", "-c", "if [ -f server.js ]; then exec node server.js; elif [ -f sirendeck/server.js ]; then cd sirendeck && exec node server.js; else ls -laR /app; exit 1; fi"]
