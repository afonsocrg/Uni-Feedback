FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS builder
RUN apk update
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@2.5.9-canary.3 prune @uni-feedback/website-ssr --docker

FROM base AS installer
RUN apk update
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/tsconfig.json .
COPY legal/ ./legal

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm dlx turbo@2.5.9-canary.3 run build --filter=@uni-feedback/website-ssr

# Deploy production dependencies to isolated directory
RUN pnpm --filter=@uni-feedback/website-ssr --prod deploy /prod/website-ssr

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=installer --chown=nodejs:nodejs /prod/website-ssr ./
COPY --from=installer --chown=nodejs:nodejs /app/apps/website-ssr/build ./build

USER nodejs

CMD ["node", "server.js"]
