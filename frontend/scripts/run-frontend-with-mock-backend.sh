#!/usr/bin/env bash
set -euo pipefail

export NEXT_PUBLIC_USE_MOCK_BACKEND=true
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8080}"

echo "[mock-backend] NEXT_PUBLIC_USE_MOCK_BACKEND=true"
echo "[mock-backend] Starting frontend with fake responses for backend endpoints"

npm run dev
