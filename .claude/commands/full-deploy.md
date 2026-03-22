Stage all changes, commit with a message, and deploy to Vercel production.

Run these commands in sequence:

```bash
cd ~/ManusMajorka

# 1. Build check first
pnpm run build

# 2. If build passes, commit and push
git add -A
git commit -m "chore: auto-deploy $(date '+%Y-%m-%d %H:%M')"
git push origin main

# 3. Trigger Vercel production deploy via API
VERCEL_TOKEN=$(grep VERCEL_TOKEN .env.local | cut -d'=' -f2-)
COMMIT=$(git rev-parse HEAD)
DEPLOY_ID=$(python3 -c "
import urllib.request, json
token='$VERCEL_TOKEN'
payload=json.dumps({'name':'manus-majorka','gitSource':{'type':'github','ref':'main','sha':'$COMMIT','repoId':'1175625068'},'target':'production'}).encode()
req=urllib.request.Request('https://api.vercel.com/v13/deployments',data=payload,headers={'Authorization':f'Bearer {token}','Content-Type':'application/json'},method='POST')
r=urllib.request.urlopen(req,timeout=10)
print(json.load(r).get('id','ERR'))
")
echo "Deploy ID: $DEPLOY_ID"

# 4. Wait for READY
for i in $(seq 1 14); do
  sleep 15
  STATUS=$(python3 -c "
import urllib.request,json
r=urllib.request.urlopen(urllib.request.Request('https://api.vercel.com/v13/deployments/$DEPLOY_ID',headers={'Authorization':'Bearer $VERCEL_TOKEN'}),timeout=10)
print(json.load(r).get('status'))
")
  echo "[$i] $STATUS"
  [ "$STATUS" = "READY" ] || [ "$STATUS" = "ERROR" ] && break
done
```

If the build fails, stop and report the TypeScript errors — do NOT deploy broken code.
Report the final deployment status and URL when done.
