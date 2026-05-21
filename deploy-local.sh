#!/usr/bin/env bash
set -euo pipefail

# Local deployment script for cricket-score-tracker
# This mirrors the GitHub Actions workflow locally.

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm ci

echo "Building production assets..."
npm run build

echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deployment complete."
