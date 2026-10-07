#!/bin/sh
# Writes /usr/share/nginx/html/config.js from env at container start. No token => empty config (analytics no-op).
set -eu
OUT=/usr/share/nginx/html/config.js
esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\r\n'; }
if [ -n "${MIXPANEL_TOKEN:-}" ]; then
  HOST="${MIXPANEL_API_HOST:-https://api-eu.mixpanel.com}"
  printf 'window.KENTE_ANALYTICS={"token":"%s","apiHost":"%s"};\n' "$(esc "$MIXPANEL_TOKEN")" "$(esc "$HOST")" > "$OUT"
else
  printf 'window.KENTE_ANALYTICS={};\n' > "$OUT"
fi
