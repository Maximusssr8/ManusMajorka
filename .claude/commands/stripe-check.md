Check Stripe live mode status by calling the Majorka health endpoint.

```bash
curl -s "https://www.majorka.io/api/health" | python3 -c "
import sys,json
d=json.load(sys.stdin)
s=d.get('stripe',{})
print(f'Stripe configured: {s.get(\"configured\")}')
print(f'Mode: {s.get(\"mode\")} (live_mode={s.get(\"live_mode\")})')
print(f'Webhook configured: {s.get(\"webhook_configured\")}')
print(f'Webhook valid: {s.get(\"webhook_looks_valid\")}')
print(f'Version: {d.get(\"version\")}')
print(f'Supabase: {d.get(\"supabase\")}')
print(f'Anthropic: {d.get(\"anthropic\")}')
"
```

Report:
- Whether Stripe is in LIVE or TEST mode
- Whether the webhook is configured and valid
- Overall system health (supabase, anthropic, stripe)

Flag any issues clearly with ❌ if something is wrong.
