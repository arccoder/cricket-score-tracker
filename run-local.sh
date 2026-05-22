#!/usr/bin/env bash
set -euo pipefail

# Run the app locally for testing.
# Usage: bash ./run-local.sh

cd "$(dirname "$0")"

echo "Starting local dev server..."
npm install
npm run dev
