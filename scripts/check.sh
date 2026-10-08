#!/bin/sh
# Build the production image, validate the nginx config, serve it, and run the SEO checks against it.
set -eu
cd "$(dirname "$0")/.."
PORT="${PORT:-8089}"
NAME="kentehq-site-check-$$"

node --check site/analytics.js
node --check scripts/gen-llms-full.mjs
node --check scripts/check-seo.mjs
node scripts/check-seo.mjs

docker build -q -t kentehq-site:check . >/dev/null
docker run --rm kentehq-site:check nginx -t
docker run -d --rm --name "$NAME" -p "127.0.0.1:$PORT:80" kentehq-site:check >/dev/null
trap 'docker stop "$NAME" >/dev/null 2>&1 || true' EXIT
i=0
until curl -fsS "http://127.0.0.1:$PORT/robots.txt" >/dev/null 2>&1; do
  i=$((i + 1)); [ "$i" -lt 50 ] || { echo "server did not start"; docker logs "$NAME"; exit 1; }
  sleep 0.2
done
node scripts/check-seo.mjs --base "http://127.0.0.1:$PORT"
