# CLAW BUILD LOG
Generated: 2026-03-15

## Completed
- [x] A2 Typography Upgrade — Cormorant Garamond/Space Grotesk+IBM Plex Mono/Playfair+Source Serif 4/Syne+Inter/Libre Baskerville+Lato
- [x] A3 Social Proof Bar — added to pass 1 prompt between hero and product sections
- [x] A4 CTA Optimisation — mobile sticky bar, prefers-reduced-motion
- [x] A5 Animation Polish — scale+fade, glow pulse, reduced motion, improved IntersectionObserver
- [x] B1 Colour Palette Generator — server endpoint + client UI with swatches
- [x] B2 Description Enhancer — server endpoint + client UI with 3 variants (benefit/story/urgency)
- [x] B3 Headline Variants — server endpoint + auto-fetch after generation, click-to-swap h1
- [x] B4 Theme Switcher — 4-button dark/light/bold/muted switcher, :root CSS vars in pass1 prompt
- [x] B5 Export Options — copy embed code, download bundle (HTML + manifest + README)
- [x] C1 Progress Checklist — 7-step checklist with ETA countdown replaces spinner
- [x] C2 Preview Panel Upgrade — 3-device toggle (desktop/tablet/mobile), theme bar in toolbar
- [x] C3 Site History — localStorage last 5 sites, load/delete in left panel
- [x] C4 Input Improvements — niche datalist dropdown (12 options), price AUD $ prefix + auto-format
- [x] D1 AU Copy Audit — enforced AU English rules in system prompt (currency, shipping, Afterpay, names)
- [x] D2 FAQ Reinforcement — 6 AU-specific FAQ questions (shipping, returns, Afterpay, quality, auth, sizing)
- [x] D3 Testimonial Reinforcement — named AU reviewers (Sarah M./Melbourne, Jake T./Brisbane, Emma K./Perth)
- [x] E1 Error Handling — Pexels fallback, stream disconnect, pass 1/2 validation, client retry button, no stack traces
- [x] E2 Performance — postProcessHtml (lazy-load images, pexels width/height, minify whitespace, strip comments), size logging
- [x] E3 SEO Basics — title/meta description/og tags/twitter card/canonical, Schema.org Product JSON-LD

## Phase E — COMPLETE
## Phase B (B3-B5) — COMPLETE
## Phase C (C1-C4) — COMPLETE
## Phase D (D1-D3) — COMPLETE

## Outstanding
- [ ] Phase E — PENDING (message truncated)
- [ ] A1 Mobile Audit (deferred — prompt includes @media, manual QA needed)

## Notes
- Favicon: confirmed working as rel="icon" data:URI
- Generation time: ~110s (2x Sonnet passes, streaming keeps UX smooth)
- All builds pass: pnpm run build + node scripts/build-api.mjs
