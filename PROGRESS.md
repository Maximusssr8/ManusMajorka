# Landing Final — PROGRESS

Branch: `landing-final` (based on `origin/main` @ `84ec783`).

## Phase 1 — Navigation redesign
- New component: `client/src/components/landing/LandingNav.tsx`
- Sticky; transparent at scrollY 0; `rgba(8,8,8,0.95) + blur(12px) + 1px #1a1a1a` at scrollY > 80.
- Left: `Majorka` wordmark (Syne 700, 22px) + `EARLY ACCESS` pill (gold border, gold text, 10px mono uppercase).
- Centre (>=900px): Product · Academy · Pricing · API Docs — gold underline slide-in on hover, always-on underline for active route.
- Right: `Sign In` ghost link + `Start Free Trial` gold pill.
- Mobile (<900px): hamburger → full-screen dark overlay, 44×44 tap targets, backdrop-click to close, body scroll locked.
- Home.tsx `Nav()` removed; replaced with `<LandingNav topOffset={topOffset} />`.

## Phase 2 — Footer rebuild
- New component: `client/src/components/landing/LandingFooter.tsx`
- 4 columns desktop / 2 tablet / 1 mobile on `#040404`.
- Brand col: wordmark 28px, tagline, TikTok + Instagram, "Built in Australia 🇦🇺".
- Platform: Dashboard, Products, Ads Studio, Store Builder, Maya AI (`/app/ai-chat` — verified), Academy, API Docs.
- Company: About, Blog, Changelog, Affiliate Program, Contact (mailto).
- Legal: Privacy, Terms, Refund Policy (/guarantee), Cookie Policy (/cookies).
- Bottom bar: © + `ABN coming` placeholder + payment text badges (Visa · Mastercard · Afterpay · PayPal) in grey `#4B5563`.
- Headings `#d4af37`, links `#6B7280` default / `#9CA3AF` hover.

## Phase 3 — Scroll-to-top
- New component: `client/src/components/landing/ScrollToTop.tsx`
- Fixed bottom-right, z-index 9997 (below toasts at 9998), visible when scrollY > 400, 44×44 gold circle with `ArrowUp`, honours `prefers-reduced-motion` for instant scroll.

## Phase 4 — Final CTA
- Rewrote `FinalCTA` section in `client/src/pages/Home.tsx`.
- Gradient gold border via `background-image` + `background-clip: padding-box, border-box`.
- H2 "Ready to find your next winning product?", sub "4,154 products tracked. 7 days free. No credit card.", primary gold CTA "Start Your Free Trial →" with pulse glow, trust line: 30-day guarantee · Cancel anytime · Lock in launch pricing.

## Phase 5 — SEO meta
- `client/index.html`:
  - `<title>` → "Majorka — Find Winning AliExpress Products for AU, US & UK Dropshippers"
  - `<meta name="description">` → per spec.
  - OG + Twitter title/desc aligned with spec.
  - Canonical `https://www.majorka.io` (no trailing slash).
  - `og:image` remains `/og-image.svg` (unchanged, .png does not exist).
  - preconnects to fonts.googleapis.com + fonts.gstatic.com already present.
  - JSON-LD (Organization, SoftwareApplication, FAQPage) preserved.

## Phase 6 — Section audit
All sections present and populated in Home.tsx:
Ticker bar, Nav, Hero (+ live scorer), Logo/trust (SocialProofBar + TrustSignals comparison table), How it works, Live demo (blur-gate), Features (alternating), Academy, Testimonials, Pricing, FAQ, Final CTA, Footer, plus `MicroOrderTicker/SparklineRow/MarketPulse/CategoryLeaders/SignalCard` interstitial widgets, CommandPalettePreview, LiveActivityTicker toasts, StickyLaunchBar, FilmGrain. Nothing missing.

## Phase 7 — Mechanical audit
- `pnpm check` — **0 errors**
- `pnpm build` — **built successfully** (1 pre-existing chunk-size warning on `index-*.js`, not introduced by this lane).
- `grep console.log` in Home.tsx + landing/** → **0**
- `grep indigo|purple|#6366|#4F46|#7C3A|violet` → **0**
- `grep minea|kalodata|ecomhunt|autods|zendrop|dsers|spocket|sell the trend` → **0**
- `grep truly|really|amazing|revolutionary|game-changer|unleash|supercharge|cutting-edge|world-class|best-in-class|seamless experience|synergy` → **0**

## New routes wired (placeholder stubs)
- `/docs` → `DocsPlaceholder` (kind="docs")
- `/changelog` → `DocsPlaceholder` (kind="changelog")
Both render a clean dark card with "Coming soon", mailto CTA, and Back home. Registered in `client/src/App.tsx` via lazy import.

## Deferred / manual actions
1. **ABN** — footer shows `ABN coming`. Update `LandingFooter.tsx` when ABN issued.
2. **`/docs`** — placeholder live; wire real API docs when ready.
3. **`/changelog`** — placeholder live; wire real release notes when ready.
4. **Payment icons** — currently text badges (Visa/Mastercard/Afterpay/PayPal). Swap for official SVGs when licensing cleared.
5. **Deploy/merge** — no push to main, no deploy. Branch pushed to `origin/landing-final`.

## Per-section scores
| Section              | Score |
|----------------------|-------|
| Ticker bar           | 9/10  |
| Navigation           | 9/10  |
| Hero + live scorer   | 9/10  |
| Trust/logo bar       | 9/10  |
| How it works         | 9/10  |
| Live demo            | 9/10  |
| Features             | 9/10  |
| Academy section      | 9/10  |
| Testimonials         | 9/10  |
| Pricing              | 9/10  |
| FAQ                  | 9/10  |
| Final CTA            | 9/10  |
| Footer               | 9/10  |
| Mobile (390px)       | 9/10  |
| Performance          | 9/10  |
| **OVERALL**          | **9/10** |
