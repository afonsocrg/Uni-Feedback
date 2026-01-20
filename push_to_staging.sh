#!/bin/bash

# Push main to staging branch
# This is a wrapper script that calls the generic push-to-branch.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

"$SCRIPT_DIR/ops/deploy/push-to-branch.sh" staging

echo "You can check the deployment status at https://github.com/afonsocrg/Uni-Feedback/actions"
