#!/usr/bin/env bash
# Simple health-check script
# Usage: ./scripts/check_api_proxy.sh [netlify_site_url]

set -euo pipefail

NETLIFY_SITE=${1:-https://watch.unrulymovies.com}
RAILWAY_API=${2:-https://luganda-translated-movies-production.up.railway.app}

echo "Checking Netlify-hosted site: $NETLIFY_SITE/api/health"
curl -sS -f -I "$NETLIFY_SITE/api/health" | sed -n '1p'

echo "\nChecking direct Railway backend: $RAILWAY_API/api/health"
curl -sS -f -I "$RAILWAY_API/api/health" | sed -n '1p'

echo "\nIf both return HTTP/1.1 200 OK, proxy and backend are reachable."
