#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment process..."

# Check if we're on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo "❌ Error: Must be on main branch to deploy. Current branch: $current_branch"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Check for unpushed commits
# if [ -n "$(git log @{u}..)" ]; then
#     echo "❌ Error: You have unpushed commits. Please push your changes first."
#     exit 1
# fi

# Pull latest changes from main
echo "📥 Pulling latest changes from main..."
git pull origin main || {
    echo "❌ Error: Failed to pull from main"
    exit 1
}

# Switch to prod branch
echo "🔄 Switching to prod branch..."
git checkout prod || {
    echo "❌ Error: Failed to checkout prod branch"
    exit 1
}

# Pull latest changes from prod
echo "📥 Pulling latest changes from prod..."
git pull origin prod || {
    echo "❌ Error: Failed to pull from prod"
    exit 1
}

# Merge main into prod
echo "🔄 Merging main into prod..."
git merge main || {
    echo "❌ Error: Failed to merge main into prod"
    exit 1
}

# Push to prod
echo "📤 Pushing to prod..."
git push origin prod || {
    echo "❌ Error: Failed to push to prod"
    exit 1
}

# Switch back to main
echo "🔄 Switching back to main branch..."
git checkout main || {
    echo "❌ Error: Failed to checkout main branch"
    exit 1
}

echo "✅ Sucessfully merged to production."
echo "You can check the deployment status at https://dash.cloudflare.com/6775eddc96fc027d1dca7762dfd44efa/pages/view/meic-feedback"