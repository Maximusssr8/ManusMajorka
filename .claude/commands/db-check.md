Run a Supabase REST health check on the trend_signals table and report:
- Total row count
- Count by source (rapidapi_datahub, cron, manual, etc.)
- Latest updated_at timestamp
- Sample of 3 most recent product names

Use these credentials (already in env):
- SUPABASE_URL from process.env or .env.local
- SUPABASE_SERVICE_ROLE_KEY from process.env or .env.local

Run this shell command:

```bash
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2-)
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d'=' -f2-)

curl -s "$SUPABASE_URL/rest/v1/trend_signals?select=source,updated_at,name&limit=300" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "apikey: $SERVICE_KEY" | python3 -c "
import sys,json
from collections import Counter
rows=json.load(sys.stdin)
counts=Counter(r.get('source','null') for r in rows)
print(f'Total rows: {len(rows)}')
for s,c in counts.most_common(): print(f'  {s}: {c}')
recent=[r for r in rows if r.get('updated_at')]
if recent:
    recent.sort(key=lambda x:x['updated_at'],reverse=True)
    print(f'Latest updated_at: {recent[0][\"updated_at\"]}')
    print('Most recent products:')
    for r in recent[:3]: print(f'  - {r[\"name\"][:60]}')
"
```

Report the results clearly.
