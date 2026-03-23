---
name: browser-automation
description: AI-driven browser automation patterns from browser-use — observe/plan/act loop, DOM extraction, structured output, error handling. Use for scraping AliExpress, TikTok, competitor ads.
---

# Browser Automation Patterns (from browser-use)

Python library for AI-driven browser automation. The agent controls a real browser via Playwright, using vision + DOM extraction to navigate, interact, and extract structured data.

## Core Loop: Observe → Plan → Act → Observe

```python
async def step(self, step_info: AgentStepInfo | None = None) -> None:
    try:
        # Phase 0: Wait for CAPTCHAs if needed
        if self.browser_session:
            captcha_wait = await self.browser_session.wait_if_captcha_solving()

        # Phase 1: OBSERVE — Get browser state (screenshot + DOM tree)
        browser_state_summary = await self._prepare_context(step_info)

        # Phase 2: PLAN & ACT — LLM decides action, execute it
        await self._get_next_action(browser_state_summary)
        await self._execute_actions()

        # Phase 3: POST-PROCESS — Update state, check downloads
        await self._post_process()

    except Exception as e:
        await self._handle_step_error(e)
```

**BrowserStateSummary includes:**
- Current URL, Screenshot (base64), DOM tree (indexed clickable elements), Accessibility tree, Tab info

## DOM Extraction

```python
class DomService:
    def __init__(self, browser_session, **kwargs):
        self.paint_order_filtering = True       # remove occluded elements
        self.max_iframes = 100
        self.viewport_threshold = 1000          # pixels beyond viewport to include
```

**DOM Node:** `tag`, `index` (unique ref for clicking), `text`, `bounds` (x,y,w,h), `is_visible`, `attributes`, `children`

## Action Types

```python
NavigateAction(url="https://...", new_tab=False)
ClickElementAction(index=42)                              # click by DOM index
InputTextAction(index=5, text="search query", clear=True)
SendKeysAction(keys="Enter")

# Structured extraction
ExtractAction(query="Extract all product prices", extract_links=True,
    output_schema={"type": "object", "properties": {...}})

# Page search (regex-capable)
SearchPageAction(pattern="\\$\\d+\\.\\d{2}", regex=True, css_scope="table.prices")
FindElementsAction(selector="div.product-card", attributes=["data-price", "data-sku"])

ScrollAction(down=True, pages=1.0)
DoneAction(text="Found 15 products", success=True)
```

## Structured Output

```python
from pydantic import BaseModel, Field

class ProductData(BaseModel):
    name: str
    price: float
    url: str
    image_url: str | None = None

class ProductResults(BaseModel):
    items: list[ProductData] = Field(default_factory=list)

agent = Agent(
    task="Find top 10 trending products on AliExpress for 'LED desk lamp'",
    llm=llm, browser=browser,
    output_model_schema=ProductResults,
)
result = await agent.run()
cart = result.structured_output  # type-safe ProductResults
```

## Error Handling

```python
max_failures: int = 5           # consecutive failures before stopping
llm_timeout: int = 90           # 30s Groq, 90s Claude
step_timeout: int = 180         # total step timeout
# Categories: InterruptedError, Connection (auto-reconnect), Parse (retry),
#             Action (increment counter), Rate limit (backoff)
# Loop detection: watches for repeated identical actions, injects "replan" nudge
```

## Custom Tools

```python
tools = Tools()

@tools.action(description='Save product data to database')
async def save_product(browser_session, product_name: str, price: float):
    await db.insert({"name": product_name, "price": price})
    return f"Saved {product_name}"

agent = Agent(task=task, llm=llm, browser=browser, tools=tools)
```

## Majorka Application

### AliExpress Scraping
```python
agent = Agent(
    task="""Search AliExpress for 'wireless earbuds Australia'.
    Extract top 20: title, price AUD, seller rating, orders, shipping time.
    Skip products with <100 orders.""",
    output_model_schema=AliExpressResults,
)
```

### TikTok Trending Products
```python
agent = Agent(
    task="""Search TikTok for '#tiktokmademebuyit Australia'.
    Extract top 20 videos: product name, view count, likes, creator.
    Only videos with >10K views.""",
    output_model_schema=TikTokTrends,
)
```

### Competitor Ad Intelligence
```python
agent = Agent(
    task="""Search Facebook Ad Library for 'StoreName' ads in Australia.
    Extract: creative text, CTA, landing URL, spend range, start date.""",
    output_model_schema=CompetitorAds,
)
```

## Key Patterns

| Pattern | Implementation |
|---------|---------------|
| Uniform response | `ActionResult(extracted_content=data, error=None)` |
| Pydantic config | `AgentSettings(max_failures=5, llm_timeout=90)` |
| State persistence | `AgentState` saved/restored across sessions |
| Loop detection | Built-in, injects replan nudge |
| Custom tools | `@tools.action(description=...)` decorator |
