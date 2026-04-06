#!/bin/bash
# Pre-commit hook for uni-feedback
# Ensures code quality before allowing commits

set -e  # Exit on any error

echo "🔍 Running pre-commit checks..."

# Check formatting (fail if files need formatting)
echo "  📝 Checking code formatting..."
pnpm run format:check

# Type check
echo "  🔧 Type checking..."
pnpm run type-check

# Lint
echo "  ✨ Linting..."
pnpm run lint

echo "✅ All pre-commit checks passed!"
