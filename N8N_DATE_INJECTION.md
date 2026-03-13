# n8n Majorka Chat Agent — Setup Notes

## What's already done in the workflow JSON

### 1. Date Injection (Set Node)
A **Set** node called "Inject Current Date" has been added between the Chat Webhook and the Call Claude API node.

- **Node type**: `n8n-nodes-base.set` (v3.4)
- **Field**: `current_date` (string)
- **Expression**: `{{ $now.format('EEEE, MMMM d, yyyy') }}`
- **Output example**: `Friday, March 13, 2026`
- **"Include Other Fields"** is enabled so the original webhook body passes through

The system prompt in the Claude API call references `$json.current_date` to inject the date dynamically.

### 2. System Prompt (Updated)
The system prompt has been replaced with the full Majorka AI prompt including date awareness, identity, behaviour rules, and the Australian market context.

---

## Manual Action Required: Add Tavily Web Search

The current workflow uses a raw HTTP Request to call the Claude API. This architecture doesn't support n8n's native "tool" connections (which require the built-in AI Agent node). There are two options:

### Option A: Add Tavily as a pre-search step (simpler, recommended for now)

This adds a Tavily search before Claude, passing web results as context. Best for use cases where you always want fresh web data.

1. **Get a Tavily API key**
   - Go to https://tavily.com and sign up (free tier: 1,000 searches/month)
   - Copy your API key from the dashboard

2. **Add Tavily API credentials in n8n**
   - Go to **Settings > Credentials > Add Credential**
   - Search for "Tavily" — if not available, use "Header Auth" with:
     - Name: `Authorization`
     - Value: `Bearer tvly-YOUR_API_KEY`

3. **Add an HTTP Request node for Tavily** (between "Inject Current Date" and "Call Claude API")
   - **Node type**: HTTP Request
   - **Name**: `Tavily Web Search`
   - **Method**: POST
   - **URL**: `https://api.tavily.com/search`
   - **Headers**: `Content-Type: application/json`
   - **Body** (raw JSON):
     ```
     ={{ JSON.stringify({
       api_key: $env.TAVILY_API_KEY,
       query: $json.body.message || $json.body.chatInput || $json.body.text || '',
       search_depth: 'basic',
       max_results: 3,
       include_answer: true
     }) }}
     ```

4. **Add a Merge/Set node** to combine Tavily results with the original data
   - Or use a **Code** node to merge:
     ```javascript
     const tavilyAnswer = $input.first().json.answer || '';
     const tavilyResults = ($input.first().json.results || [])
       .map(r => `- ${r.title}: ${r.url}\n  ${r.content}`)
       .join('\n');

     return [{
       json: {
         ...$input.first().json,
         web_context: tavilyAnswer
           ? `## Recent Web Search Results\n${tavilyAnswer}\n\nSources:\n${tavilyResults}`
           : ''
       }
     }];
     ```

5. **Update the Claude API body** to include web context in the user message:
   - Change the messages array to:
     ```
     messages: [{
       role: 'user',
       content: ($json.web_context ? $json.web_context + '\n\n---\n\nUser question: ' : '')
         + ($json.body.message || $json.body.chatInput || $json.body.text || 'Hello')
     }]
     ```

6. **Add `TAVILY_API_KEY` to your n8n environment** (`.env.n8n` or n8n Settings > Variables)

### Option B: Rebuild using n8n's AI Agent node (more powerful, recommended long-term)

This replaces the raw HTTP Request approach with n8n's native AI Agent node, which supports tool connections natively.

1. **Delete** the "Call Claude API" HTTP Request node

2. **Add an AI Agent node**
   - Node type: `@n8n/n8n-nodes-langchain.agent`
   - Agent type: Tools Agent
   - Connect an **Anthropic Chat Model** sub-node:
     - Model: `claude-sonnet-4-20250514`
     - Set your Anthropic API key as a credential
   - Paste the full system prompt into the Agent's "System Message" field
   - Use the expression `{{ $json.current_date }}` in the system prompt where the date should appear

3. **Add a Tavily Tool node**
   - Node type: `@n8n/n8n-nodes-langchain.toolTavily`
   - Add your Tavily API credential
   - Connect it to the AI Agent's **tools** input (the ai_tool connector, not the main connector)

4. **Wire the flow**:
   ```
   Chat Webhook → Inject Current Date → AI Agent → Respond to Chat
                                           ↑
                                      Tavily Tool (tools input)
                                      Anthropic Chat Model (ai_languageModel input)
   ```

5. **Update "Respond to Chat"** to match the AI Agent's output format:
   - The AI Agent node outputs `{{ $json.output }}` instead of `{{ $json.content[0].text }}`

### Environment Variables Needed

| Variable | Where to set | Purpose |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | n8n env / .env.n8n | Claude API access |
| `TAVILY_API_KEY` | n8n env / .env.n8n | Web search (get from https://tavily.com) |
