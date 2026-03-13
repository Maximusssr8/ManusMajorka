#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Majorka n8n Workflow Importer
# Reads workflow definitions from n8n-workflows.json and POSTs each to n8n API
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

N8N_URL="${N8N_URL:-http://localhost:5678}"
N8N_API_KEY="${N8N_API_KEY:?Set N8N_API_KEY environment variable}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKFLOWS_FILE="$SCRIPT_DIR/n8n-workflows.json"

if [ ! -f "$WORKFLOWS_FILE" ]; then
  echo "ERROR: $WORKFLOWS_FILE not found"
  exit 1
fi

# Check n8n is reachable
if ! curl -sf "$N8N_URL/healthz" > /dev/null 2>&1; then
  echo "ERROR: n8n not reachable at $N8N_URL"
  exit 1
fi

WORKFLOW_COUNT=$(jq 'length' "$WORKFLOWS_FILE")
echo "Found $WORKFLOW_COUNT workflows to import"
echo "═══════════════════════════════════════════"

IMPORTED=0
FAILED=0
WEBHOOK_URLS=""

for i in $(seq 0 $(($WORKFLOW_COUNT - 1))); do
  NAME=$(jq -r ".[$i].name" "$WORKFLOWS_FILE")
  echo ""
  echo "[$((i+1))/$WORKFLOW_COUNT] Importing: $NAME"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$N8N_URL/api/v1/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq ".[$i]" "$WORKFLOWS_FILE")")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    WF_ID=$(echo "$BODY" | jq -r '.id // "unknown"')
    echo "  ✅ Created (ID: $WF_ID)"
    IMPORTED=$((IMPORTED + 1))

    # Activate the workflow
    ACTIVATE_RESP=$(curl -s -o /dev/null -w "%{http_code}" \
      -X PATCH "$N8N_URL/api/v1/workflows/$WF_ID" \
      -H "X-N8N-API-KEY: $N8N_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"active": true}')

    if [ "$ACTIVATE_RESP" = "200" ]; then
      echo "  ✅ Activated"
    else
      echo "  ⚠️  Could not activate (HTTP $ACTIVATE_RESP) — activate manually in n8n UI"
    fi

    # Extract webhook paths
    WEBHOOK_PATH=$(jq -r ".[$i].nodes[] | select(.type == \"n8n-nodes-base.webhook\") | .parameters.path // empty" "$WORKFLOWS_FILE")
    if [ -n "$WEBHOOK_PATH" ]; then
      FULL_URL="$N8N_URL/webhook/$WEBHOOK_PATH"
      echo "  🔗 Webhook: $FULL_URL"
      WEBHOOK_URLS="$WEBHOOK_URLS\n  $NAME: $FULL_URL"
    fi
  else
    echo "  ❌ Failed (HTTP $HTTP_CODE)"
    echo "  $BODY" | head -3
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "═══════════════════════════════════════════"
echo "IMPORT COMPLETE"
echo "  ✅ Imported: $IMPORTED"
echo "  ❌ Failed: $FAILED"

if [ -n "$WEBHOOK_URLS" ]; then
  echo ""
  echo "WEBHOOK URLs:"
  echo -e "$WEBHOOK_URLS"
fi

echo ""
echo "Next steps:"
echo "  1. Set these env vars in your .env:"
echo "     N8N_WEBHOOK_URL=$N8N_URL/webhook/majorka-welcome"
echo "     N8N_SIGNUP_WEBHOOK_URL=$N8N_URL/webhook/majorka-signup-alert"
echo "     N8N_UPGRADE_WEBHOOK_URL=$N8N_URL/webhook/majorka-upgrade-nudge"
echo "  2. Configure Gmail/SMTP credentials in n8n UI"
echo "  3. Configure Telegram bot token in n8n UI"
