Trigger the RapidAPI DataHub product seed to refresh 20 products in the trend_signals table.

Call the admin endpoint:

```bash
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2-)

curl -s -X POST "https://www.majorka.io/api/admin/refresh-db-rapidapi" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  --max-time 120 | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(f'Inserted: {d.get(\"total\")} products')
for r in d.get('results',[]): print(f'  {\"✅\" if not r.get(\"error\") else \"❌\"} {r[\"niche\"]}: {r.get(\"count\",0)}')
"
```

Report how many products were seeded per niche and the total.
