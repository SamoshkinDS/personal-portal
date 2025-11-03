#!/bin/bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/personal-portal}"
DEFAULT_BRANCH="${BRANCH:-main}"
TARGET_BRANCH="${1:-$DEFAULT_BRANCH}"

echo "=== Pull latest changes (branch: ${TARGET_BRANCH}) ==="
cd "$PROJECT_DIR"

if ! git fetch origin "$TARGET_BRANCH"; then
  echo "!! git fetch failed" >&2
  exit 1
fi

if ! git reset --hard "origin/${TARGET_BRANCH}"; then
  echo "!! git reset failed" >&2
  exit 1
fi

if git submodule status >/dev/null 2>&1; then
  git submodule update --init --recursive
fi

echo "=== Git pull complete ==="
