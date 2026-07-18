# Web Scanner — Pricing Tracker Design System

> Source prompt: `futuristic-sass-landing-page` (adapted to violet primary per product brief).
> Brand: **Web Scanner** — modular web price-scraper SaaS. First module: **Pricing Tracker**.
> Audience: power users (devs, ops, e-commerce analysts) — feel: futuristic, premium, dashboard-grade.

---

## 1. Product Context

- **Product**: Web Scanner — a modular SaaS platform for tracking web data. Composed of independent "modules" surfaced in a sidenav.
- **First module**: **Pricing Tracker** — track prices for products across multiple sources (URLs), with currency conversion and historical price charts.
- **Feel**: power-user dashboard. Premium. Slightly "command-center". Dark-first.
- **Component aesthetic**: PrimeVue Material — cards with subtle borders, dialogs with backdrop blur, data tables, chips/badges for tags and currency labels.
- **Accessibility target**: WCAG 2.1 AA, contrast ratio ≥ 4.5:1 for all text/background pairs.

---

## 2. Color Palette

### 2.1 Violet Primary Scale (Tailwind violet inspired, aligned to PrimeVue Material violet)

| Token | Value | Usage |
|-------|-------|-------|
| `--violet-50` | `#F5F3FF` | Tinted hover backgrounds (light) |
| `--violet-100` | `#EDE9FE` | Selected row tints, chip backgrounds (light) |
| `--violet-200` | `#DDD6FE` | Soft borders, hover rings |
| `--violet-300` | `#C4B5FD` | Muted accents, inactive chips |
| `--violet-400` | `#A78BFA` | Hover state for primary buttons |
| `--violet-500` | `#8B5CF6` | Primary accent — secondary actions |
| `--violet-600` | `#7C3AED` | **Primary** — buttons, active states, brand |
| `--violet-700` | `#6D28D9` | Primary pressed, strong accents |
| `--violet-800` | `#5B21B6` | Deep accents, gradient ends |
| `--violet-900` | `#4C1D95` | High-contrast text on light backgrounds |

### 2.2 Dark Theme Surfaces (DEFAULT)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0F0F1A` | App background — deep near-black slate |
| `--bg-surface` | `#1A1A2E` | Card / panel background |
| `--bg-surface-elevated` | `#22223A` | Modal / popover surface |
| `--bg-sidenav` | `#0B0B14` | Sidebar — deeper than main to anchor layout |
| `--bg-topbar` | `rgba(15,15,26,0.7)` + `backdrop-filter: blur(16px)` | Top bar — glassmorphism |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Default border |
| `--border-strong` | `rgba(255,255,255,0.16)` | Hover/focus border |
| `--text-primary` | `#F4F4F8` | Primary copy — 4.6:1 on `#0F0F1A` ✓ |
| `--text-secondary` | `#A0A0B8` | Secondary copy — 4.5:1 on `#0F0F1A` ✓ |
| `--text-muted` | `#6B6B85` | Captions, helper text — non-AA targets OK |
| `--accent-primary` | `#7C3AED` | Violet-600 |
| `--accent-primary-hover` | `#8B5CF6` | Violet-500 |

### 2.3 Light Theme Surfaces ("surface-mist")

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#F8F7FB` | **surface-mist** — app background |
| `--bg-surface` | `#FFFFFF` | Card / panel |
| `--bg-surface-elevated` | `#FFFFFF` + shadow | Modal / popover |
| `--bg-sidenav` | `#FFFFFF` | Sidebar — clean white |
| `--bg-topbar` | `rgba(255,255,255,0.85)` + `backdrop-filter: blur(12px)` | Top bar — glassmorphism |
| `--border-subtle` | `rgba(15,15,26,0.08)` | Default border |
| `--border-strong` | `rgba(15,15,26,0.16)` | Hover/focus border |
| `--text-primary` | `#0F0F1A` | Primary copy — 16:1 ✓ |
| `--text-secondary` | `#4A4A5E` | Secondary copy — 8.6:1 ✓ |
| `--text-muted` | `#7A7A8C` | Captions, helper text |
| `--accent-primary` | `#7C3AED` | Same violet |
| `--accent-primary-hover` | `#6D28D9` | Pressed |

### 2.4 Semantic Accents (used for price direction + system states)

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#10B981` | Price down (good for buyer) — green |
| `--success-bg` | `rgba(16,185,129,0.12)` | Chip background |
| `--danger` | `#F43F5E` | Price up (bad for buyer) — rose-red |
| `--danger-bg` | `rgba(244,63,94,0.12)` | Chip background |
| `--warning` | `#F59E0B` | Multiple matches warning badge — amber |
| `--warning-bg` | `rgba(245,158,11,0.12)` | Warning chip background |
| `--info` | `#3B82F6` | Informational tags — blue |
| `--info-bg` | `rgba(59,130,246,0.12)` | Info chip background |
| `--favorite` | `#FACC15` | Star/favorite — gold yellow |

### 2.5 Gradients & Glow

- **Primary CTA glow**: `radial-gradient(from `#8B5CF6` via `#7C3AED` to `#5B21B6`), blur(20px), opacity(0.35)`
- **Hero accent line** (sidenav top): linear gradient `#A78BFA → #7C3AED → #5B21B6`, 1px tall, full sidebar width.
- **Card hover lift**: shadow transitions from `0 4px 16px rgba(0,0,0,0.1)` → `0 8px 32px rgba(124,58,237,0.18)` + subtle violet ring.

---

## 3. Typography

**Type stack** — clean sans-serif system, optimized for dashboard density:

| Role | Font | Weight | Size | Line height | Tracking |
|------|------|--------|------|-------------|----------|
| Display (hero) | **Inter** | 700 | 48px / 60px | 1.1 | -0.02em |
| H1 (page title) | **Inter** | 700 | 32px / 40px | 1.15 | -0.01em |
| H2 (section) | **Inter** | 600 | 24px / 32px | 1.2 | -0.01em |
| H3 (card title) | **Inter** | 600 | 18px / 26px | 1.3 | 0 |
| Body Lg | **Inter** | 400 | 16px / 24px | 1.5 | 0 |
| Body | **Inter** | 400 | 14px / 22px | 1.5 | 0 |
| Label (chip, button) | **Inter** | 500 | 13px / 18px | 1.3 | 0.01em |
| Caption | **Inter** | 400 | 12px / 16px | 1.4 | 0.01em |
| Numeric (prices) | **JetBrains Mono** | 500 | 14px / 20px | 1.3 | 0 |
| Brand accent (logo) | **Space Grotesk** | 700 | 20px / 24px | 1.1 | -0.01em |

**Hierarchy rules**: 700 headings, 500 labels, 400 body — never use 300.
**Numeric values**: tabular-nums for prices and timestamps so columns line up.
**All-caps**: only for chip labels and small status badges (font-feature-settings: "smcp" off, letter-spacing: 0.05em).

---

## 4. Spacing & Layout

- **Base unit**: 4px. All spacing values are multiples of 4.
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- **Card padding**: 20px (compact) or 24px (spacious).
- **Section gutters**: 24px on desktop, 16px on tablet, 12px on mobile.
- **Grid**: 12-column responsive grid with 24px gutters; collapses to 6 columns at md, 4 at sm.
- **Product card grid**: 3 columns ≥1280px, 2 columns 768–1279px, 1 column <768px.
- **Sidenav width**: 240px fixed.
- **Top bar height**: 64px.
- **Modal**: max-width 720px (Create Item); full-screen sheet on mobile.
- **Border radius**: 6px (small — chips, inputs), 12px (cards), 16px (modals), 999px (pills).
- **Elevation** (shadows):
  - Level 1 (card): `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
  - Level 2 (popover): `0 4px 16px rgba(0,0,0,0.12)`
  - Level 3 (modal): `0 16px 48px rgba(0,0,0,0.24)`

---

## 5. Components

### 5.1 Card (product / source card)
- Surface: `bg-surface`, border `1px solid border-subtle`, radius 12px, padding 20px.
- Subtle hover lift: translateY(-2px) + Level 2 shadow + 1px violet-700 ring on hover.
- Optional violet glow variant for primary cards (e.g. main source): `box-shadow: 0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px rgba(124,58,237,0.15)`.

### 5.2 Modal / Dialog
- Backdrop: `rgba(15,15,26,0.7)` + `backdrop-filter: blur(8px)`.
- Surface: `bg-surface-elevated`, radius 16px, padding 32px, max-width 720px (Create Item).
- Header: H2 title + X close icon button (top-right, 32×32 hit area).
- Footer: right-aligned actions, 12px gap, Cancel (outlined) + Okay (violet filled).

### 5.3 Data Table (admin / history views)
- Row height 48px, alternating subtle surface tint on hover.
- Header: 13px label weight 500, uppercase letter-spacing 0.05em, muted text.
- Cell padding: 12px 16px. Numeric columns right-aligned with tabular-nums.
- Sticky header with `--bg-surface` opaque background.

### 5.4 Chip / Badge (tags, currency, status)
- Height 24px, padding 0 10px, radius 999px.
- Variants: filled (accent-primary background, white text), outlined (border only, accent text), soft (bg of `--{semantic}-bg`).
- Currency chip: always uses the violet filled variant — `USD`, `EUR`, `GBP`, `JPY`, `CAD`, `MXN`, `COP`.
- Tag chip: outlined variant, clickable to filter.

### 5.5 Buttons
- **Primary**: `bg-violet-600`, white text, radius 8px, height 40px, padding 0 16px. Hover: violet-500. Active: violet-700. Subtle glow shadow on focus.
- **Secondary / outlined**: `bg-transparent`, border `1px solid border-strong`, text primary. Hover: surface tint.
- **Ghost / icon-only**: 40×40, radius 8px, transparent bg, hover surface tint.
- **Danger**: `bg-danger`, white text. Reserved for Delete.

### 5.6 Inputs (text, dropdown, file upload)
- Height 40px, padding 0 12px, radius 8px, `bg-surface`, border `border-subtle`.
- Focus: 2px violet-500 ring (no border color change — use `box-shadow`).
- File upload: dashed border, 48px padding, hover bg tint, drag-over violet-500 ring.

### 5.7 Line Chart (price history)
- Stroke: `violet-600` 2px.
- Area fill: linear gradient `rgba(124,58,237,0.3)` → `rgba(124,58,237,0)` top-to-bottom.
- Grid lines: `rgba(255,255,255,0.06)` (dark) / `rgba(15,15,26,0.06)` (light).
- Tooltip: glass surface, mono-numeric, accent dot.
- Hover dot: 6px circle, violet-400 stroke, white fill.

### 5.8 Sidenav item
- Height 44px, padding 0 16px, radius 8px (with 8px horizontal margin).
- Default: `text-secondary`, icon 20px.
- Hover: surface tint, `text-primary`.
- Active: `bg-violet-600/15`, `text-violet-300`, left 2px accent bar (full height), subtle glow on icon.

### 5.9 Toggle (dark/light theme)
- 48×28px pill, sliding 22px circle.
- Track: violet-600 (dark mode) / slate-200 (light mode).
- Knob: white, sun/moon icon centered.
- 150ms ease-in-out transition.

---

## 6. Dark / Light Theme Tokens

**Mechanism**: CSS custom properties driven by `:root` (light, default) and `:root[data-theme="dark"]` (dark, default OS preference). Vue 3 stores the choice in `localStorage`; the toggle button in the top bar flips it.

```css
:root {
  --bg-base: #F8F7FB;            /* surface-mist */
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #FFFFFF;
  --bg-sidenav: #FFFFFF;
  --bg-topbar: rgba(255,255,255,0.85);
  --border-subtle: rgba(15,15,26,0.08);
  --border-strong: rgba(15,15,26,0.16);
  --text-primary: #0F0F1A;
  --text-secondary: #4A4A5E;
  --text-muted: #7A7A8C;
  --accent-primary: #7C3AED;
  --accent-primary-hover: #6D28D9;
}

:root[data-theme="dark"] {
  --bg-base: #0F0F1A;
  --bg-surface: #1A1A2E;
  --bg-surface-elevated: #22223A;
  --bg-sidenav: #0B0B14;
  --bg-topbar: rgba(15,15,26,0.7);
  --border-subtle: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.16);
  --text-primary: #F4F4F8;
  --text-secondary: #A0A0B8;
  --text-muted: #6B6B85;
  --accent-primary: #7C3AED;
  --accent-primary-hover: #8B5CF6;
}
```

**Rule**: every UI surface must consume the tokens — never hardcode hex values in component CSS.

---

## 7. Motion

- **Theme toggle**: 150ms ease-in-out on background/color transitions.
- **Card hover lift**: 150ms ease-out, `translateY(-2px)`.
- **Modal open/close**: 200ms ease-out, opacity + scale(0.98 → 1).
- **Sidebar active transition**: 200ms ease-in-out on bg + accent bar.
- **Page transitions**: 250ms ease-in-out, fade + slight upward translate (8px).
- **Chart line draw**: 400ms ease-out on initial render.
- **Pulse glow** (active scrape in progress): 1.5s ease-in-out infinite, violet-600 ring pulse.

**Honor `prefers-reduced-motion`** — disable non-essential motion (lift, pulse), keep only opacity transitions.

---

## 8. Futuristic Touches

These elevate the "command center" feel without overwhelming the dashboard:

1. **Sidenav accent line** at the very top — 1px linear gradient `#A78BFA → #7C3AED → #5B21B6` full-width.
2. **Primary CTA glow** — buttons emit a soft violet radial-gradient blur at 35% opacity. Pulses gently when form is submittable.
3. **Subtle grid/dot background** option for empty hero states and the app shell main placeholder (1px dots, 24px spacing, `rgba(124,58,237,0.04)` in dark, `rgba(124,58,237,0.06)` in light).
4. **Glassmorphism** — top bar and modal backdrops use `backdrop-filter: blur(12-16px)`.
5. **Gradient text accents** — the "Pricing Tracker" page title and large numerals can use a `bg-clip-text` gradient `#C4B5FD → #7C3AED` for emphasis.
6. **Animated stat counters** — price badges fade-in with a brief 200ms count-up on initial load (skipped under reduced motion).
7. **Monospace numerics** — all prices use JetBrains Mono tabular-nums, reinforcing the "telemetry" feel.
8. **Status chips with left bar** — currency chips and source status indicators feature a 2px vertical accent bar (violet for normal, green/red for price direction).

---

## 9. Iconography

- **Library**: PrimeIcons (matches PrimeVue Material aesthetic). Fallback: lucide-style outline icons.
- **Style**: 1.5px stroke, rounded line caps, 20px default in nav, 16px in chips, 24px in buttons.
- **Key icons used**:
  - `pi-tag` — module nav, tag chip
  - `pi-star-fill` (yellow) / `pi-star` — favorite toggle
  - `pi-search` — search bar
  - `pi-plus` — add new (item, source, tag)
  - `pi-external-link` — open source URL
  - `pi-refresh` — scrape now
  - `pi-pencil` — edit
  - `pi-trash` — delete
  - `pi-sun` / `pi-moon` — theme toggle
  - `pi-chart-line` — price history
  - `pi-cog` — settings
  - `pi-times` — close

---

## 10. Iconography — Module Sidenav

- **Pricing Tracker** icon: `pi-tag` (or `pi-dollar`).
- **Future modules** (placeholder slot, lower opacity): `pi-search` (SEO), `pi-chart-bar` (Analytics), `pi-shield` (Monitoring).

---

## 11. Empty States

- Large 64×64 icon centered, in muted color.
- One-sentence headline (Inter 600, 18px) + one-sentence body (Inter 400, 14px, text-secondary).
- Single primary CTA below (violet filled).
- Subtle grid-dot background to fill the empty space.

---

## 12. Implementation Notes (for engineer)

- Use **Tailwind CSS** with custom CSS variables in `tailwind.config.js` for tokens.
- Use **PrimeVue** (Material preset) for dialogs, data tables, dropdowns, multi-select, calendar. Wrap and re-skin with violet tokens.
- Use **Pinia** for app state — no localStorage state in components; theme preference lives in `useThemeStore`.
- Use **Chart.js** or **vue-chartjs** (line chart) with violet-600 stroke and gradient area fill.
- Use **vueuse** `useColorMode` as a base for theme persistence, or roll a 30-line custom composable.
- Use **`@vueuse/motion`** for hover lift / pulse glow (auto-honors reduced motion).
- Lock the type system: strict `tsc --noEmit`, no `any`. Theme tokens typed in `src/types/theme.ts`.

---

## 13. Accessibility Checklist

- [ ] All interactive elements ≥40×40 hit area
- [ ] Focus rings always visible (violet-500, 2px, 2px offset)
- [ ] All form inputs have associated `<label>`
- [ ] Modals trap focus, restore on close
- [ ] Theme toggle announces state via `aria-pressed`
- [ ] Charts have `aria-label` summarizing data + a hidden `<table>` fallback for screen readers
- [ ] Color is never the only signal — price-direction chips include arrow icons (↑ ↓) and "up"/"down" text
- [ ] All images / product photos have `alt`
- [ ] Skip-to-content link on app shell
- [ ] Keyboard navigable sidenav (arrow keys move focus between modules)

---

## 14. Don'ts

- ❌ Never use pure black `#000000` or pure white `#FFFFFF` for surfaces — use the slate-tinted tokens.
- ❌ Never use violet-500 (`#8B5CF6`) for primary CTA — always violet-600 (`#7C3AED`); violet-500 is for hover.
- ❌ Never animate non-essential motion if user prefers reduced motion.
- ❌ Never use red/green alone to signal price direction — pair with arrow icons + text.
- ❌ Never put primary buttons on gradient backgrounds without explicit contrast verification.
- ❌ Never use more than 3 elevation levels in a single screen.

---

**End of design system. Use this file as `--context-file` for every superdesign command.**