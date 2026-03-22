<!-- TYPEUI_SH_MANAGED_START -->
# Clean Design System Skill (Universal)

## Mission
You are an expert design-system guideline author for Clean.
Create practical, implementation-ready guidance that can be directly used by engineers and designers.

## Brand
Clean design style focuses on simplicity, minimalism, and high usability, using ample whitespace, legible typography, and limited color palettes to reduce visual clutter

## Style Foundations
- Visual style: minimal, clean
- Typography scale: 12/14/16/20/24/32 | Fonts: primary=Roboto, display=Poppins, mono=Inconsolata | weights=100, 200, 300, 400, 500, 600, 700, 800, 900
- Color palette: primary, neutral, success, warning, danger | Tokens: primary=#3B82F6, secondary=#8B5CF6, success=#16A34A, warning=#D97706, danger=#DC2626, surface=#FFFFFF, text=#111827
- Spacing scale: 8pt baseline grid

## Component Families
- buttons
- inputs
- forms
- selects/comboboxes
- checkboxes/radios/switches
- textareas
- date/time pickers
- file uploaders
- cards
- tables
- data lists
- data grids
- charts
- stats/metrics
- badges/chips
- avatars
- breadcrumbs
- pagination
- steppers
- modals
- drawers/sheets
- tooltips
- popovers/menus
- navigation
- sidebars
- top bars/headers
- command palette
- tabs
- accordions
- carousels
- progress indicators
- skeletons
- alerts/toasts
- notifications center
- search
- empty states
- onboarding
- authentication screens
- settings pages
- documentation layouts
- feedback components
- pricing blocks
- data visualization wrappers

## Accessibility
WCAG 2.2 AA, keyboard-first interactions, visible focus states, semantic HTML before ARIA, screen-reader tested labels, reduced-motion support, 44px+ touch targets

## Writing Tone
clear, friendly

## Rules: Do
- prefer semantic tokens over raw values
- keep interaction states explicit
- design for empty/loading/error states

## Rules: Don't
- avoid low contrast text
- avoid inconsistent spacing rhythm
- avoid decorative motion without purpose
- avoid ambiguous labels

## Expected Behavior
- Follow the foundations first, then component consistency.
- When uncertain, prioritize accessibility and clarity over novelty.
- Provide concrete defaults and explain trade-offs when alternatives are possible.
- Keep guidance opinionated, concise, and implementation-focused.

## Guideline Authoring Workflow
1. Restate the design intent in one sentence before proposing rules.
2. Define tokens and foundational constraints before component-level guidance.
3. Specify component anatomy, states, variants, and interaction behavior.
4. Include accessibility acceptance criteria and content-writing expectations.
5. Add anti-patterns and migration notes for existing inconsistent UI.
6. End with a QA checklist that can be executed in code review.

## Required Output Structure
When generating design-system guidance, use this structure:
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Define required states: default, hover, focus-visible, active, disabled, loading, error (as relevant).
- Describe interaction behavior for keyboard, pointer, and touch.
- State spacing, typography, and color-token usage explicitly.
- Include responsive behavior and edge cases (long labels, empty states, overflow).

## Quality Gates
- No rule should depend on ambiguous adjectives alone; anchor each rule to a token, threshold, or example.
- Every accessibility statement must be testable in implementation.
- Prefer system consistency over one-off local optimizations.
- Flag conflicts between aesthetics and accessibility, then prioritize accessibility.

## Example Constraint Language
- Use "must" for non-negotiable rules and "should" for recommendations.
- Pair every do-rule with at least one concrete don't-example.
- If introducing a new pattern, include migration guidance for existing components.

<!-- TYPEUI_SH_MANAGED_END -->


---

# Majorka Design System — Specific Overrides

> This section OVERRIDES and EXTENDS the Clean base above for the Majorka app.
> **Product:** Majorka — AI Ecommerce OS for Australian Dropshippers
> **Stack:** React + Vite + TypeScript + Tailwind CSS (inline JSX styles)
> **Theme:** Light sidebar / dark content; class-based dark mode (`html.dark`)

---

## Color Tokens

| Token | Light | Dark |
|---|---|---|
| Background | `#FAFAFA` | `#09090B` |
| Surface / Card | `#FFFFFF` | `#18181B` |
| Border | `#E5E7EB` | `#27272A` |
| Text primary | `#0A0A0A` | `#FAFAFA` |
| Text muted | `#6B7280` | `#A1A1AA` |
| **Accent primary** | `#6366F1` | `#6366F1` |
| Accent secondary | `#8B5CF6` | `#8B5CF6` |
| Accent hover | `#4F46E5` | `#4F46E5` |
| Accent light bg | `#EEF2FF` | `#1E1E3F` |
| Success | `#10B981` | `#10B981` |
| Warning | `#F59E0B` | `#F59E0B` |
| Destructive | `#EF4444` | `#EF4444` |

**NEVER use:** `#d4af37` (old gold), `#080a0e` as a background in light mode.

---

## Typography

| Use | Font | Weight | Size |
|---|---|---|---|
| Display / H1 | Bricolage Grotesque | 800 | 40–64px |
| H2 / H3 | Bricolage Grotesque | 700 | 24–32px |
| UI / Body | Geist / DM Sans | 400–500 | 14–16px |
| Labels / caps | Geist | 600 | 11–12px + letter-spacing 0.08em |
| Monospace | Geist Mono | 400 | 13px |

---

## Spacing & Radius

- **Base grid:** 4px (use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48)
- **Card radius:** 12px
- **Button radius:** 8px
- **Input radius:** 6px
- **Badge radius:** 4px (or 999px for pill)

---

## Shadows

| Name | Value |
|---|---|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` |
| `shadow-lg` | `0 20px 40px rgba(0,0,0,0.12)` |
| `shadow-glow` | `0 0 0 2px #6366F1, 0 20px 40px rgba(99,102,241,0.20)` |

---

## Animations

| Timing | Value |
|---|---|
| Micro (hover, active) | 150ms `cubic-bezier(0.4, 0, 0.2, 1)` |
| Route / fade | 200ms ease |
| Modals / sheets | 300ms `cubic-bezier(0.4, 0, 0.2, 1)` |
| List stagger | `calc(var(--row-index) * 40ms)` delay |

**Required animations:**
- `@keyframes fadeInUp` on all data table rows
- `@keyframes pulseBadge` on score badges ≥ 80
- `@keyframes blob-drift` on landing page hero (3 blobs, 8–12s loop)

---

## Buttons

```
Primary:   bg #6366F1  hover #4F46E5  text white    radius 8px
Ghost:     border #6366F1  text #6366F1  hover bg #EEF2FF
Secondary: bg #F3F4F6  hover #E5E7EB  text #374151
Danger:    bg #EF4444  hover #DC2626  text white
```
**All buttons:** `:hover { transform: scale(1.02) }` · `:active { transform: scale(0.97) }` · `transition: 150ms`

---

## Sidebar (App Shell)

```
Light mode:
  background:   #FFFFFF
  border-right: 1px solid #E5E7EB
  logo text:    #111827  font: Syne, 700
  nav text:     #374151
  nav hover:    background #F5F3FF  color #6366F1  transition 150ms
  active item:  background #EEF2FF  color #6366F1  border-left 3px solid #6366F1
  bottom zone:  background #F9FAFB  border-top 1px solid #E5E7EB

Dark mode (html.dark):
  background:   #0C0C0E
  border-right: 1px solid rgba(255,255,255,0.06)
  nav text:     #A1A1AA
  active item:  background #1C1C20  color #6366F1  border-left 3px solid #6366F1
```

---

## Tags / Badges

| Tag | Background | Text | Weight |
|---|---|---|---|
| HIGH MARGIN | `#EEF2FF` | `#6366F1` | 600 |
| VIRAL / 🔥 | `#F3E8FF` | `#8B5CF6` | 600 |
| AU DEMAND / 🇦🇺 | `#ECFEFF` | `#0891B2` | 600 |
| TikTok / ⚡ | `#F0FDF4` | `#059669` | 600 |
| PRO plan | `#6366F1` bg | `white` | 700 + uppercase + letter-spacing 0.05em |

---

## Product Intelligence Table

- **Row default:** background transparent
- **Row hover:** background `#F5F3FF`, transition 150ms
- **Score badge ≥ 80:** `background #EEF2FF, border 2px solid #6366F1, color #6366F1` + pulse animation
- **Score badge 65–79:** `background #F3E8FF, border 2px solid #8B5CF6, color #8B5CF6`
- **Score badge < 65:** `background #F9FAFB, border 2px solid #9CA3AF, color #6B7280`
- **Build Store button:** `background #6366F1, hover #4F46E5, text white`
- **Supplier link:** `border 1px solid #6366F1, color #6366F1, hover: fill #6366F1 white text`

---

## Landing Page

- **Hero blob mesh:** 3 divs, `border-radius: 50%`, `filter: blur(80px)`, 15% opacity
  - Blob 1: `rgba(99,102,241,0.10)` 500×500px, `animation: blob-drift-1 8s`
  - Blob 2: `rgba(139,92,246,0.09)` 400×400px, `animation: blob-drift-2 10s`
  - Blob 3: `rgba(6,182,212,0.07)` 350×350px, `animation: blob-drift-3 12s`
- **Floating product cards:** `backdrop-filter: blur(8px)`, `border: 1px solid rgba(99,102,241,0.3)`, slight rotation (−3°, +2°), `animation: fadeInUp`
- **Gradient text:** `background: linear-gradient(135deg, #6366F1, #8B5CF6)`, `background-clip: text`, `-webkit-text-fill-color: transparent`
- **Navbar (sticky):** `backdrop-filter: blur(12px)`, `background: rgba(250,250,250,0.8)`, `border-bottom: 1px solid #E5E7EB`; scroll shadow after 50px

---

## Glass Morphism (key sections)

```css
.glass-light {
  backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.70);
  border: 1px solid rgba(255,255,255,0.20);
}
.glass-dark {
  backdrop-filter: blur(12px);
  background: rgba(9,9,11,0.70);
  border: 1px solid rgba(255,255,255,0.08);
}
```

---

## Dark Mode

- Toggle: Sun/Moon icon in sidebar header (lucide-react `Sun` / `Moon`)
- Storage: `localStorage.getItem('majorka-theme')` → `'light'` | `'dark'`
- Class: `html.dark` enables dark CSS variables
- Flash prevention: script in `index.html` `<body>` reads `localStorage` before React mounts

---

## QA Checklist (run before every PR)

- [ ] No `#d4af37` (gold) anywhere in new code
- [ ] All new buttons have `:hover scale(1.02)` + `:active scale(0.97)`
- [ ] Table rows use `#F5F3FF` hover (not grey)
- [ ] Score badges use tier-based indigo/violet/grey system
- [ ] New text on `#6366F1` backgrounds checked for WCAG AA (white text ✅)
- [ ] New modals/sheets animate in at 300ms
- [ ] New list views have `--row-index` CSS variable for stagger
- [ ] Sidebar active state uses `border-left: 3px solid #6366F1` not background-only
