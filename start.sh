#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/backend"
[ ! -d node_modules ] && npm install
[ ! -f database.sqlite ] && node seed.js
( sleep 1 && (xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null || true) ) &
node server.js
