#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting zero-downtime STAGING deployment...${NC}"

# Ensure we're in the project root
cd "$(dirname "$0")/../.."

# Make sure we're on the staging branch
echo -e "${YELLOW}🔄 Checking out staging branch...${NC}"
git checkout staging

# Pull latest changes (already done by GitHub Action, but just in case)
echo -e "${YELLOW}📥 Ensuring latest code...${NC}"
git pull origin staging

# Build images sequentially to avoid high CPU usage
echo -e "${YELLOW}🔨 Building images sequentially...${NC}"
docker compose -f docker-compose.staging.yml build api-staging
docker compose -f docker-compose.staging.yml build website-ssr-staging
# docker compose -f docker-compose.staging.yml build dashboard-staging

# Deploy with zero downtime
echo -e "${YELLOW}🚢 Starting containers...${NC}"
docker compose -f docker-compose.staging.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to stabilize...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker compose -f docker-compose.staging.yml ps

# Show recent logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
docker compose -f docker-compose.staging.yml logs --tail=30

# Cleanup old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Staging deployment completed successfully!${NC}"
