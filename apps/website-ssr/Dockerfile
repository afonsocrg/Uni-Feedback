# Multi-stage Dockerfile: Build with Bun, Run with Node.js (best of both worlds)

# Stage 1: Build with Bun (handles workspaces and builds fast)
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Install Python and build tools for native modules
RUN apk add --no-cache python3 make g++

# Copy the entire monorepo
COPY . .

# Install all dependencies and build
RUN bun install
WORKDIR /app/apps/website-ssr
RUN bun run build

# Stage 2: Runtime with Node.js (better React compatibility)
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Copy the entire built app from builder stage
COPY --from=builder /app /app

# Set proper ownership
RUN chown -R appuser:nodejs /app
USER appuser

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Move to website-ssr directory
WORKDIR /app/apps/website-ssr

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application with Node.js
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]