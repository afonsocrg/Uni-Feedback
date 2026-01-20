#!/bin/bash

# Generic script to merge main into a target branch and push
# Usage: ./push-to-branch.sh <target_branch>

set -e

TARGET_BRANCH="$1"

if [ -z "$TARGET_BRANCH" ]; then
    echo "Error: No target branch specified"
    echo "Usage: $0 <target_branch>"
    exit 1
fi

echo "Starting deployment process to $TARGET_BRANCH..."

# Check if we're on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo "Error: Must be on main branch to deploy. Current branch: $current_branch"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Pull latest changes from main
echo "Pulling latest changes from main..."
git pull origin main || {
    echo "Error: Failed to pull from main"
    exit 1
}

# Switch to target branch
echo "Switching to $TARGET_BRANCH branch..."
git checkout "$TARGET_BRANCH" || {
    echo "Error: Failed to checkout $TARGET_BRANCH branch"
    exit 1
}

# Pull latest changes from target branch
echo "Pulling latest changes from $TARGET_BRANCH..."
git pull origin "$TARGET_BRANCH" || {
    echo "Error: Failed to pull from $TARGET_BRANCH"
    exit 1
}

# Merge main into target branch
echo "Merging main into $TARGET_BRANCH..."
git merge main || {
    echo "Error: Failed to merge main into $TARGET_BRANCH"
    exit 1
}

# Push to target branch
echo "Pushing to $TARGET_BRANCH..."
git push origin "$TARGET_BRANCH" || {
    echo "Error: Failed to push to $TARGET_BRANCH"
    exit 1
}

# Switch back to main
echo "Switching back to main branch..."
git checkout main || {
    echo "Error: Failed to checkout main branch"
    exit 1
}

echo "Successfully merged main to $TARGET_BRANCH."
