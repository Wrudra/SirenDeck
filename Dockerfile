# SirenDeck — Blocks Release / kaniko (pnpm + Next standalone)
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --allow-build=unrs-resolver --allow-build=sharp
COPY . .
ARG NEXT_PUBLIC_BLOCKS_KEY
ARG NEXT_PUBLIC_BLOCKS_API_URL
ARG NEXT_PUBLIC_BLOCKS_OIDC_URL
ARG NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID
ARG NEXT_PUBLIC_BLOCKS_OIDC_SCOPE
ARG NEXT_PUBLIC_BLOCKS_APP_DOMAIN
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
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
