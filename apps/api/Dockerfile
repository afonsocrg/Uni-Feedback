FROM oven/bun:1.2-alpine AS base

FROM base AS builder
RUN apk update
WORKDIR /app
RUN bun install turbo@2.5.9-canary.1 --global
COPY . .
RUN turbo prune uni-feedback-api --docker

FROM base AS installer
RUN apk update
RUN apk add --no-cache python3 make g++
RUN bun install turbo@2.5.9-canary.1 --global
WORKDIR /app

COPY --from=builder /app/out/json/ .
# CMD ["/bin/sh"]
RUN bun install

COPY --from=builder /app/tsconfig.json .

# No build step needed - Bun runs TypeScript directly

FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 api
USER api

COPY --from=builder /app/out/full/ .
COPY --from=installer --chown=api:bunjs /app/node_modules ./node_modules
# COPY --from=installer --chown=api:bunjs /app/apps/api/src ./src
# COPY --from=installer --chown=api:bunjs /app/apps/api/package.json .
# COPY --from=installer --chown=api:bunjs /app/apps/api/tsconfig.json .

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["bun", "apps/api/src/server.ts"]