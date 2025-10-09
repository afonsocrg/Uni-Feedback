#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting zero-downtime deployment...${NC}"

# Ensure we're in the project root
cd "$(dirname "$0")/../.."

# Pull latest changes (already done by GitHub Action, but just in case)
echo -e "${YELLOW}📥 Ensuring latest code...${NC}"
git pull origin prod

# Build and deploy with zero downtime
echo -e "${YELLOW}🔨 Building and deploying containers...${NC}"
docker-compose up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to stabilize...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker-compose ps

# Show recent logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
docker-compose logs --tail=30

# Cleanup old images
echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
