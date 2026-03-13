#!/bin/bash
# Start Majorka Discord Bot
cd "$(dirname "$0")"

export DISCORD_BOT_TOKEN=$(grep DISCORD_BOT_TOKEN ~/ManusMajorka/.env.local | cut -d'=' -f2)

if [ -z "$DISCORD_BOT_TOKEN" ]; then
  echo "❌ DISCORD_BOT_TOKEN not found in .env.local"
  exit 1
fi

echo "✅ Starting Majorka Discord Bot..."
nohup node bot.js > /tmp/discord-bot.log 2>&1 &
echo "✅ Bot PID: $!"
echo "📋 Log: /tmp/discord-bot.log"
