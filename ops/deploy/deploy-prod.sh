#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting zero-downtime PRODUCTION deployment...${NC}"

# Ensure we're in the project root
cd "$(dirname "$0")/../.."

# Make sure we're on the prod branch
echo -e "${YELLOW}🔄 Checking out prod branch...${NC}"
git checkout prod

# Pull latest changes (already done by GitHub Action, but just in case)
echo -e "${YELLOW}📥 Ensuring latest code...${NC}"
git pull origin prod

# Login to GHCR
echo -e "${YELLOW}🔐 Authenticating with GHCR...${NC}"
source .env.docker
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin

# Pull latest images from GHCR
echo -e "${YELLOW}📥 Pulling images from GHCR...${NC}"
docker compose -p uni-feedback-prod -f docker-compose.prod.yml pull

# Deploy with zero downtime
echo -e "${YELLOW}🚢 Starting containers...${NC}"
docker compose -p uni-feedback-prod -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to stabilize...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker compose -p uni-feedback-prod -f docker-compose.prod.yml ps

# Show recent logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
docker compose -p uni-feedback-prod -f docker-compose.prod.yml logs --tail=30

# Cleanup old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
