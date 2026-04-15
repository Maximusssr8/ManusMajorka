# fix-product-surfaces — progress

Branch isolated from main. Lane: Maya / Creators / Analytics / Settings.


## Creators (Fix 4 + 5) — done
- {brand} pulled from /api/stores (first saved_store.name, .myshopify.com stripped); fallback "Your Brand"
- {product} pulled from localStorage majorka_last_viewed_product (string or JSON); fallback "Your product"
- {creator} editable contenteditable span with gold dashed underline + "click to edit" hint
- "Reset to template" toggles between substituted view and original placeholders
- Recommendation tier now derived from category (Beauty/Fashion → Nano/Micro, Tech → Micro/Mid-tier, Home/Pet → Micro, Fitness → Mid-tier/Macro, unknown → omitted)

