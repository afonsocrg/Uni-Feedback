FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS builder
RUN apk update
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune uni-feedback-api --docker

FROM base AS installer
RUN apk update
WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/tsconfig.json .

# Build the API
RUN pnpm dlx turbo run build --filter=uni-feedback-api

# Deploy production dependencies to isolated directory
RUN pnpm --filter=uni-feedback-api --prod deploy /prod/api

FROM base AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

COPY --from=installer --chown=api:nodejs /prod/api ./
COPY --from=installer --chown=api:nodejs /app/apps/api/dist ./dist
COPY --from=installer --chown=api:nodejs /app/apps/api/templates ./templates

USER api

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
