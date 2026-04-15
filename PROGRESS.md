# fix-product-surfaces — progress

Branch isolated from main. Lane: Maya / Creators / Analytics / Settings.


## Creators (Fix 4 + 5) — done
- {brand} pulled from /api/stores (first saved_store.name, .myshopify.com stripped); fallback "Your Brand"
- {product} pulled from localStorage majorka_last_viewed_product (string or JSON); fallback "Your product"
- {creator} editable contenteditable span with gold dashed underline + "click to edit" hint
- "Reset to template" toggles between substituted view and original placeholders
- Recommendation tier now derived from category (Beauty/Fashion → Nano/Micro, Tech → Micro/Mid-tier, Home/Pet → Micro, Fitness → Mid-tier/Macro, unknown → omitted)


## Analytics (Fix 6 + 7) — done
- "general" rendered as "Uncategorised" and sorted to the bottom (still groups all current "general" rows in DB)
- "Re-categorise" gold button on the categories card prompts for X-Admin-Token then calls POST /api/admin/recategorise
- New POST /api/admin/recategorise picks 100 null/general rows, asks Claude Haiku for {category}, updates winning_products. Capped at 100 per call.
- Your Activity row of 4 tiles fed by GET /api/analytics/my-activity
- New /api/analytics/my-activity endpoint: usage_counters → api_cost_log fallback for briefs/ads, JOIN product_lists/product_list_items for saves, optional product_views for top category. Each source try/catch → 0/null on missing table.

