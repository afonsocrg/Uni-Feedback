FROM oven/bun:1.2-alpine AS base


FROM base AS builder
RUN apk update
# RUN apk add --no-cache libc6-compat
# RUN apk add --no-cache python3 make g++
WORKDIR /app
RUN bun install turbo --global
COPY . .
RUN turbo prune @uni-feedback/website-ssr --docker

FROM base AS installer
RUN apk update
RUN bun install turbo --global
# RUN apk add --no-cache libc6-compat
# RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY --from=builder /app/out/json/ .
RUN bun install

COPY --from=builder /app/out/full/ .
COPY --from=builder /app/tsconfig.json .
COPY --from=builder /app/terms_of_service.md .
COPY --from=builder /app/privacy_policy.md .

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN bun run build:website-ssr

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=installer --chown=nodejs:nodejs /app/apps/website-ssr/build ./build
COPY --from=installer --chown=nodejs:nodejs /app/apps/website-ssr/server.js .
COPY --from=installer --chown=nodejs:nodejs /app/apps/website-ssr/package.json .
COPY --from=installer --chown=nodejs:nodejs /app/node_modules ./node_modules

# Debug only!
CMD ["node", "server.js"]
