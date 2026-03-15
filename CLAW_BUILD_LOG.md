# CLAW BUILD LOG
Generated: 2026-03-15

## Completed
- [x] A2 Typography Upgrade — Cormorant Garamond/Space Grotesk+IBM Plex Mono/Playfair+Source Serif 4/Syne+Inter/Libre Baskerville+Lato
- [x] A3 Social Proof Bar — added to pass 1 prompt between hero and product sections
- [x] A4 CTA Optimisation — mobile sticky bar, prefers-reduced-motion
- [x] A5 Animation Polish — scale+fade, glow pulse, reduced motion, improved IntersectionObserver
- [x] B1 Colour Palette Generator — server endpoint + client UI with swatches
- [x] B2 Description Enhancer — server endpoint + client UI with 3 variants (benefit/story/urgency)

## Outstanding
- [ ] A1 Mobile Audit (deferred — prompt includes @media, manual QA needed)

## Notes
- Favicon: confirmed working as rel="icon" data:URI
- Generation time: ~110s (2x Sonnet passes, streaming keeps UX smooth)
- All builds pass: pnpm run build + node scripts/build-api.mjs
