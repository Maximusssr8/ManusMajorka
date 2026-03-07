# Majorka Project TODO

## Foundation
- [x] Initialise project scaffold (web-db-user)
- [x] Read and analyse Majorka Menu HTML (403KB)
- [x] Database schema: subscriptions table
- [x] Server routers: subscription procedures
- [x] Upload Majorka Menu HTML to CDN

## Landing Page
- [x] Hero section (headline, subheadline, CTA)
- [x] Feature highlights grid (AI tools, website builder, ads studio, chat, insights)
- [x] Social proof / testimonials section
- [x] Pricing section (single plan $99/month)
- [x] Footer with nav links
- [x] App preview iframe with lock overlay

## Auth & Subscription Gate
- [x] Manus OAuth login flow
- [x] Subscription status check on protected routes
- [x] Grant access after subscription activation
- [x] Redirect unauthenticated users to login

## Protected Dashboard
- [x] Route /dashboard — requires auth + active subscription
- [x] Embed full Majorka Menu HTML in iframe (CDN-hosted)
- [x] postMessage mk_access_granted to iframe after subscription verified
- [x] Subscription gate UI (shown when user is logged in but not subscribed)

## Subscription Management
- [x] /account page — view plan, status, billing info
- [x] Activate subscription button
- [x] Cancel subscription flow with confirmation dialog

## Tests
- [x] Subscription router unit tests (6 tests)
- [x] Auth logout test (1 test)
- [x] All 7 tests passing

## Polish
- [x] Fix pre-existing scaffold TS errors (Markdown, AIChatBox, ComponentShowcase)
- [x] Dark gold theme (CSS variables, Syne + DM Mono fonts via Google Fonts)
- [x] Responsive nav bar on all pages
