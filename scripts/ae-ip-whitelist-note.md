# AliExpress API IP Whitelist

The AliExpress App IP Whitelist is currently EMPTY (no restrictions).

## Vercel Serverless IPs
Vercel uses dynamic IPs — they cannot be whitelisted reliably.

## Options:
1. **Keep empty** (current) — no IP restriction, works for all Vercel functions
2. **Add Vercel Edge IPs** — see https://vercel.com/docs/concepts/edge-network/regions
3. **Use a fixed-IP proxy** (e.g. Fixie, Quotaguard) — route API calls through a static IP

## Recommendation:
Leave empty during development/test phase. When moving to production + Live API status,
evaluate whether AliExpress requires IP whitelisting for the Affiliates API.
The Affiliates API does not typically require IP whitelisting (unlike the Open Platform API).
