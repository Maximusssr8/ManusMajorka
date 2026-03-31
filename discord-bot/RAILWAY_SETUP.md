# Majorka Discord Bot — Railway Deployment

## One-Time Setup (Manual Steps)

### 1. Create Railway Project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select `Maximusssr8/ManusMajorka`
4. Set **Root Directory** to `discord-bot`
5. Railway auto-detects Node.js and runs `npm start`

### 2. Add Environment Variables
In Railway dashboard → your service → **Variables**, add:

| Variable | Value | Where to find |
|---|---|---|
| `DISCORD_BOT_TOKEN` | Your bot token | Discord Developer Portal → Bot → Token |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | Claude API key for ad briefs | console.anthropic.com → API Keys |

Optional (for /deploy command):
| `VERCEL_TOKEN` | Vercel token | Vercel → Account Settings → Tokens |

### 3. Deploy
Railway auto-deploys on every push to `main`. First deploy triggers automatically after you set env vars.

### 4. Verify
Check Railway logs — you should see:
```
✅ Majorka Bot online: Majorka#7641
```

## What's Running
- `bot.js` — main bot process (slash commands, verification, welcome DMs)
- HTTP bridge on port `:3001` for external triggers (Claw/n8n webhooks)

## Environment Variables Reference
```
DISCORD_BOT_TOKEN=       # Required — from Discord Developer Portal
SUPABASE_SERVICE_ROLE_KEY= # Required — for /verify command
VERCEL_TOKEN=            # Optional — for /deploy command
```

## Logs
Railway dashboard → your service → **Logs** tab

## Auto-Restart
Configured with `ON_FAILURE` restart policy (max 3 retries). Railway keeps the process alive 24/7.
