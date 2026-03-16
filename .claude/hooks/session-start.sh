#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# No external dependencies to install — vanilla HTML/CSS/JS project
# Verify Node.js is available for running tests
if command -v node &> /dev/null; then
  echo "Node.js $(node --version) available for test runner"
else
  echo "WARNING: Node.js not found — test-calculations.js requires Node.js"
fi
