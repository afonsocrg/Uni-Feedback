#!/bin/bash
# Pre-commit hook for uni-feedback
# Auto-formats staged files before committing

set -e

echo "Formatting staged files..."
pnpm lint-staged

echo "Done!"
