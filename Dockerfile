# SirenDeck — Blocks Release / kaniko (pnpm + Next standalone)
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --allow-build=unrs-resolver --allow-build=sharp
COPY . .

# Bake public NEXT_PUBLIC_* as plain ENV (not ARG) so empty pipeline
# --build-arg values cannot wipe the client bundle. Public values only.
ENV NEXT_PUBLIC_BLOCKS_KEY=D158bd535e4d44ea58e5c53146704e2ab \
    NEXT_PUBLIC_BLOCKS_API_URL=https://blocksapi.slsblx.com \
    NEXT_PUBLIC_BLOCKS_OIDC_URL=https://iam.seliseblocks.com/D158bd535e4d44ea58e5c53146704e2ab \
    NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=e6307866-2c00-42c3-b94d-d63c6581c9ed \
    NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=openid profile \
    NEXT_PUBLIC_BLOCKS_APP_DOMAIN=https://dblcyi-eocee.slsblx.com \
    NEXT_PUBLIC_AUTH_PROVIDER=blocks \
    NEXT_PUBLIC_DATA_PROVIDER=blocks \
    NEXT_TELEMETRY_DISABLED=1
RUN echo "OIDC client id for build: $NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID" \
 && pnpm run build \
 && ls -la .next/standalone \
 && (test -f .next/standalone/server.js || test -f .next/standalone/sirendeck/server.js)

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_BLOCKS_KEY=D158bd535e4d44ea58e5c53146704e2ab \
    NEXT_PUBLIC_BLOCKS_API_URL=https://blocksapi.slsblx.com \
    NEXT_PUBLIC_BLOCKS_OIDC_URL=https://iam.seliseblocks.com/D158bd535e4d44ea58e5c53146704e2ab \
    NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID=e6307866-2c00-42c3-b94d-d63c6581c9ed \
    NEXT_PUBLIC_BLOCKS_OIDC_SCOPE=openid profile \
    NEXT_PUBLIC_BLOCKS_APP_DOMAIN=https://dblcyi-eocee.slsblx.com \
    NEXT_PUBLIC_AUTH_PROVIDER=blocks \
    NEXT_PUBLIC_DATA_PROVIDER=blocks
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
CMD ["sh", "-c", "if [ -f server.js ]; then exec node server.js; elif [ -f sirendeck/server.js ]; then cd sirendeck && exec node server.js; else ls -laR /app; exit 1; fi"]
