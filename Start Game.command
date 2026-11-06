#!/usr/bin/env bash
# Standalone macOS Launcher for Hill Climb Racing (Works outside Antigravity)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  🏁 Hill Climb Racing - Standalone Server 🏁 "
echo "=========================================================="

# 1. Start Node Server if not running
if ! lsof -i :8080 >/dev/null 2>&1; then
  echo "▶ Starting game server on port 8080..."
  nohup node server.js > server.log 2>&1 &
  sleep 1
else
  echo "✓ Game server is already active on port 8080."
fi

# 2. Start Cloudflare Tunnel if installed
if command -v cloudflared >/dev/null 2>&1; then
  if ! pgrep -f "cloudflared tunnel --url http://127.0.0.1:8080" >/dev/null 2>&1; then
    echo "▶ Starting Cloudflare Universal Tunnel..."
    rm -f cloudflared.log
    nohup cloudflared tunnel --url http://127.0.0.1:8080 --protocol http2 > cloudflared.log 2>&1 &
    sleep 3
  fi
  TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' cloudflared.log 2>/dev/null | tail -n 1)
fi

WIFI_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

echo ""
echo "=========================================================="
echo "  LINKS TO PLAY (Works even when Antigravity is closed):"
echo "=========================================================="
if [ -n "$TUNNEL_URL" ]; then
  echo "  🌐 Universal Link (Cellular / Anywhere):"
  echo "     $TUNNEL_URL"
  echo ""
fi
if [ -n "$WIFI_IP" ]; then
  echo "  📱 Local Wi-Fi Link (Phones on same Wi-Fi):"
  echo "     http://${WIFI_IP}:8080"
  echo ""
fi
echo "  💻 Mac Link:"
echo "     http://localhost:8080"
echo "=========================================================="
echo ""
echo "Opening game in browser..."
open "http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server when you are done playing."
# Keep process alive so Terminal stays active
tail -f server.log
