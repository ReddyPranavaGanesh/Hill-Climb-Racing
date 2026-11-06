#!/bin/bash
DIR="/Users/reddypranavaganesh/.gemini/antigravity/scratch/hill_climb_racing"
NODE_BIN="/Users/reddypranavaganesh/.nvm/versions/node/v24.21.0/bin/node"
CF_BIN="/opt/homebrew/bin/cloudflared"

cd "$DIR"

# Free port 8080 and old cloudflared
lsof -ti:8080 | xargs kill -9 2>/dev/null
pkill -f "cloudflared tunnel --url" 2>/dev/null

sleep 1

# Start Node server
"$NODE_BIN" server.js > server.log 2>&1 &
SERVER_PID=$!

sleep 2

# Start Cloudflare Tunnel
rm -f cloudflared.log
"$CF_BIN" tunnel --url http://127.0.0.1:8080 --protocol http2 > cloudflared.log 2>&1 &
CF_PID=$!

for i in {1..15}; do
  URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cloudflared.log 2>/dev/null | tail -n 1)
  if [ -n "$URL" ]; then
    echo "$URL" > universal_link.txt
    break
  fi
  sleep 1
done

wait
