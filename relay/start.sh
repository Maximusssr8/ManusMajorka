#!/bin/bash
# Start AliExpress relay + ngrok tunnel
# Usage: bash relay/start.sh
set -e

RELAY_PORT=18820
RELAY_SECRET="${RELAY_SECRET:-majorka_relay_2026}"

echo "🚀 Starting AliExpress relay server on port $RELAY_PORT..."
RELAY_SECRET=$RELAY_SECRET node /Users/maximus/ManusMajorka/relay/server.mjs &
RELAY_PID=$!
echo "   PID: $RELAY_PID"

sleep 2

echo "🌐 Starting ngrok tunnel..."
ngrok http $RELAY_PORT \
  --log=stdout \
  --log-format=json \
  --domain="" 2>&1 &
NGROK_PID=$!

sleep 3

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | node -e "
const d=require('fs').readFileSync('/dev/stdin','utf8');
try{const t=JSON.parse(d).tunnels;console.log(t.find(x=>x.proto==='https')?.public_url||'');}catch{console.log('');}
")

if [ -z "$NGROK_URL" ]; then
  echo "❌ Could not get ngrok URL — check ngrok dashboard"
else
  echo ""
  echo "✅ Relay live at: $NGROK_URL"
  echo "   Health: $NGROK_URL/relay/health?secret=$RELAY_SECRET"
  echo ""
  echo "Add to Vercel:"
  echo "  ALIEXPRESS_RELAY_URL=$NGROK_URL"
  echo "  RELAY_SECRET=$RELAY_SECRET"
fi

wait $RELAY_PID
