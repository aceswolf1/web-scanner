# Product Card — Design Specification

This document describes the visual design, structure, and implementation logic of the `ItemCard` component used in the WebCrawlr Pricing Tracker. Use it to replicate the card faithfully in any stack or context.

---

## Visual Overview

```
┌──────────────────────────────────────────┐
│  ┌──────┐  Product Name Here        [★]  │  ← Header (16px padding)
│  │ img  │  Tag1   Tag2                   │
│  └──────┘                                │
│  30d trend                      +2.3% ↑  │  ← Trend row
│ ╭────────────────────────────────────╮   │
│ │  ╱╲    ╱╲__╱╲____╱╲__╱╲   •       │   │  ← SVG sparkline (56px tall)
│ │ ╱  ╲__╱               ╲__╱        │   │
│ ╰────────────────────────────────────╯   │
├──────────────────────────────────────────┤
│  $1,249.99  USD           amazon.com  2h │  ← Footer
│                                    [3 ⬡] │  ← Source count badge
└──────────────────────────────────────────┘
```

The card is divided into **three vertical zones**: Header, Sparkline, Footer.

---

## Card Shell

The outermost container is a `div` with these properties:

| Property | Value |
|---|---|
| Background | `bg-card` (token: `--card`, `#0F0B1E` dark / `#FFFFFF` light) |
| Border | `border border-border` (token: `--border`, `rgba(139,92,246,0.18)` dark / `rgba(124,58,237,0.15)` light) |
| Border radius | `rounded-2xl` (1rem) |
| Overflow | `hidden` (clips the sparkline SVG flush to edges) |
| Cursor | `pointer` |
| Hover border | `hover:border-primary/50` — violet at 50% opacity |
| Hover shadow | `hover:shadow-[0_0_28px_rgba(139,92,246,0.2)]` — violet outer glow |
| Transition | `transition-all duration-300` |
| Tailwind group | `group` — enables `group-hover:` on child elements |

```tsx
<div className="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer
  hover:border-primary/50 hover:shadow-[0_0_28px_rgba(139,92,246,0.2)] transition-all duration-300">
```

---

## Zone 1 — Header

**Padding:** `px-4 pt-4 pb-3`  
**Layout:** `flex items-start gap-3` (row, top-aligned, 12px gap)  
**Position context:** `relative` (anchors the absolute favorite button)

### 1a. Product Thumbnail

A square image container, top-left of the header row.

| Property | Value |
|---|---|
| Size | `w-11 h-11` (44×44px) |
| Shape | `rounded-xl` (12px radius) |
| Overflow | `hidden` |
| Background | `bg-muted` (shows while image loads) |
| Border | `border border-border/60` |
| Flex | `shrink-0` (never collapses) |

**With image:** `<img>` with `object-cover`, `w-full h-full`. Attach an `onError` handler that sets a boolean flag to fall back to the placeholder.

**Placeholder (no image / error):** A `div` with `bg-gradient-to-br from-primary/20 to-accent/20` containing a `Package` icon (`w-5 h-5 text-primary/40`).

```tsx
<div className="w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
  {hasImage ? (
    <img src={url} alt={name} onError={handleErr} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
      <Package className="w-5 h-5 text-primary/40" />
    </div>
  )}
</div>
```

### 1b. Name + Tags Column

The column that fills remaining header width. Has `flex-1 min-w-0 pr-7` (right padding reserves space for the absolute-positioned favorite button).

**Product name:**
- `font-semibold text-sm text-foreground`
- `leading-snug line-clamp-2` — wraps to two lines max, then truncates
- `mb-1.5` bottom margin before tags

**Tag pills (if any):** Rendered as `flex flex-wrap gap-1`. Show at most 2 tags; if more exist, append an overflow counter: `text-[10px] text-muted-foreground self-center font-mono` with content `+N`.

Each tag pill is a `<span>` with:
- `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap`
- Background: `${tag.color}22` (hex color at ~13% opacity)
- Text color: `tag.color` (full saturation)
- Border: `1px solid ${tag.color}44` (hex color at ~27% opacity)

### 1c. Favorite Button

Absolutely positioned at `top-3.5 right-3.5`. Does **not** propagate clicks to the card's `onClick`.

| Property | Value |
|---|---|
| Size | `w-7 h-7` (28×28px) |
| Shape | `rounded-full` |
| Background | `bg-background/70 backdrop-blur-sm` |
| Border | `border border-border/60`, on group hover: `group-hover:border-primary/30` |
| Hover | `hover:bg-background` |
| Icon | `Star` from lucide-react, `w-3.5 h-3.5` |

**Active state (favorited):** `fill="#FBBF24" stroke="#FBBF24"` (amber)  
**Inactive state:** `fill="none" stroke="currentColor"` (inherits text color)

```tsx
<button
  onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
  className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm
    flex items-center justify-center hover:bg-background transition-colors border border-border/60
    group-hover:border-primary/30"
>
  <Star className="w-3.5 h-3.5 transition-colors"
    fill={isFavorite ? "#FBBF24" : "none"}
    stroke={isFavorite ? "#FBBF24" : "currentColor"} />
</button>
```

---

## Zone 2 — Sparkline

The middle zone has no padding on the sides (the SVG stretches edge-to-edge). It contains two children:

### 2a. Trend Label Row

`flex items-center justify-between px-4 mb-1`

**Left label:** `"30d trend"` in `text-[10px] font-mono text-muted-foreground uppercase tracking-wider`

**Right badge (conditional — only when % change is calculable):**  
A `<span>` with `flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md`

| Trend direction | Text color | Background |
|---|---|---|
| Positive (≥ 0%) | `text-emerald-400` | `bg-emerald-400/10` |
| Negative (< 0%) | `text-red-400` | `bg-red-400/10` |

Badge content: a `TrendingUp` or `TrendingDown` icon (`w-3 h-3`) followed by the formatted percentage, e.g. `+2.3%` or `-1.8%`. Positive values get an explicit `+` prefix.

**% change formula:**
```
pctChange = ((currentPrice - firstHistoryPrice) / firstHistoryPrice) * 100
```
Where `firstHistoryPrice` is the oldest point in `priceHistory`.

### 2b. SVG Sparkline

A pure SVG element — no charting library. Stretches the full card width, fixed at **56px tall**.

```tsx
<svg viewBox="0 0 200 56" preserveAspectRatio="none" style={{ width: "100%", height: 56 }}>
```

**Key properties:**
- `viewBox="0 0 200 56"` — internal coordinate space is 200 wide × 56 tall
- `preserveAspectRatio="none"` — SVG stretches to fill available width without letterboxing

**Data preparation (last 30 points):**
```
prices = data.slice(-30).map(p => p.price)
min    = Math.min(...prices)
max    = Math.max(...prices)
range  = max - min  || (min * 0.02) || 1   // guard against flat/zero data
W = 200, H = 56, PAD = 5

coords[i].x = (i / (prices.length - 1)) * W
coords[i].y = H - PAD - ((price - min) / range) * (H - PAD * 2)
```

The 5px vertical padding (`PAD`) keeps the line from touching the top and bottom edges.

**SVG elements rendered (in order, back to front):**

1. **`<defs>` — Vertical gradient fill**
   ```svg
   <linearGradient id="sg-{itemId}" x1="0" y1="0" x2="0" y2="1">
     <stop offset="0%"  stopColor={color} stopOpacity="0.4" />
     <stop offset="90%" stopColor={color} stopOpacity="0.02" />
   </linearGradient>
   ```
   The gradient ID must be unique per card instance (e.g. `sg-${item.id}`) to avoid conflicts when multiple cards render simultaneously. Generate it once with `useMemo`.

2. **`<path>` — Area fill**
   ```
   areaPath = "M0,56 L{x0},{y0} L{x1},{y1} ... L200,56 Z"
   ```
   Starts at the bottom-left corner, traces all data points, ends at bottom-right, closes. Fill: `url(#sg-{itemId})`.

3. **`<path>` — Line**
   ```
   linePath = "M{x0},{y0} L{x1},{y1} L{x2},{y2} ..."
   ```
   Fill: `none`. Stroke: `color`, `strokeWidth="1.75"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

4. **`<circle>` — Solid endpoint dot**  
   At the last coordinate. `r="3"`, `fill={color}`.

5. **`<circle>` — Halo ring**  
   Same center as the endpoint dot. `r="5"`, `fill={color}`, `fillOpacity="0.25"`. Creates a soft pulse effect.

**Color logic:**
| Condition | `color` value |
|---|---|
| `isPositive === true` | `"#34D399"` (emerald-400) |
| `isPositive === false` | `"#F87171"` (red-400) |

**Empty state:** If fewer than 2 data points exist, render a placeholder `div` (`h-14 flex items-center justify-center`) with the text `"No history"` styled `text-[10px] text-muted-foreground/40 font-mono`.

---

## Zone 3 — Footer

**Padding:** `px-4 pt-2.5 pb-3.5`  
**Border-top:** `border-t border-border/50`  
**Layout:** `flex items-end justify-between gap-2`

### 3a. Price Block (left side, `min-w-0`)

**Main price (if available):**  
`flex items-baseline gap-1`
- Price value: `font-mono text-lg font-bold text-primary leading-none`
  - `text-primary` = violet (`#8B5CF6` dark / `#7C3AED` light)
  - Format: currency-aware. For JPY/COP: no decimals, locale-formatted. Others: 2 decimal places with symbol prefix.
- Currency code: `text-xs text-muted-foreground font-mono`

**No price state:** `text-xs text-muted-foreground font-mono` with content `"No price yet"`

**Meta row** (`flex items-center gap-2 mt-1`):
- Source hostname: `text-[10px] text-muted-foreground/70 font-mono truncate max-w-[110px]`
  - Derived by parsing the source URL: `new URL(url).hostname.replace("www.", "")`
- Last-scraped time: `flex items-center gap-0.5 text-[10px] text-muted-foreground/60 font-mono shrink-0`
  - Prefixed by a `Clock` icon (`w-2.5 h-2.5`)
  - Formatted as relative time: `"Just now"`, `"2m ago"`, `"3h ago"`, `"2d ago"`

### 3b. Source Count Badge (right side)

`flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono shrink-0 border border-border/50`

Contains a `Link2` icon (`w-2.5 h-2.5`) and the integer count of sources. Example: `⬡ 3`.

---

## Design Tokens Referenced

These CSS custom properties must be defined on `:root` and `.dark`:

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--card` | `#FFFFFF` | `#0F0B1E` | Card background |
| `--card-foreground` | `#1A0A3C` | `#F0EEFF` | Text on card |
| `--border` | `rgba(124,58,237,0.15)` | `rgba(139,92,246,0.18)` | Card border |
| `--primary` | `#7C3AED` | `#8B5CF6` | Price text, hover glow |
| `--accent` | `#A855F7` | `#A855F7` | Thumbnail placeholder gradient |
| `--muted` | `#F3EEFF` | `#150F2A` | Thumbnail fallback bg |
| `--muted-foreground` | `#6B5FA0` | `#7C6FA0` | Labels, meta text |
| `--secondary` | `#EDE9FE` | `#1A1330` | Source count badge bg |
| `--secondary-foreground` | `#4C1D95` | `#C4B5FD` | Source count badge text |
| `--background` | `#FAF8FF` | `#08050F` | Favorite button bg fallback |

---

## Typography

All text in this card uses two font families:

| Role | Family | Tailwind class |
|---|---|---|
| Product name, tag overflow counter | Inter (sans-serif) | default body font |
| Prices, currency codes, hostnames, times, labels | JetBrains Mono | `font-mono` |

---

## Data Model

The card requires these fields from the item and its main source:

```ts
interface IPricePoint {
  date: string;    // "YYYY-MM-DD"
  price: number;
}

interface ISource {
  id: string;
  url: string;
  currency: "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "MXN" | "COP";
  currentPrice: number | null;
  isMain: boolean;
  lastScraped: string | null;  // ISO 8601
  priceHistory: IPricePoint[];
}

interface IItem {
  id: string;
  name: string;
  imageUrl: string;
  tagIds: string[];
  sources: ISource[];
  isFavorite: boolean;
}

interface ITag {
  id: string;
  name: string;
  color: string;  // hex, e.g. "#8B5CF6"
}
```

The main source is resolved as:
```ts
const mainSrc = item.sources.find(s => s.isMain) ?? item.sources[0];
```

---

## Interaction Behaviour

| Event | Target | Effect |
|---|---|---|
| Click card body | Entire card div | Calls `onClick()` — navigates to item detail |
| Click favorite button | Star button | Calls `onToggleFavorite()` — **must** call `e.stopPropagation()` to prevent card click |
| Image load error | `<img>` onError | Sets `imgErr = true` → renders placeholder gradient instead |

---

## Complete Component Reference

```tsx
// Requires: useState, useMemo from "react"
// Requires: Star, Package, TrendingUp, TrendingDown, Clock, Link2 from "lucide-react"

function Sparkline({ data, gradId, positive }) {
  const pts = data.slice(-30);
  if (pts.length < 2) return (
    <div className="h-14 flex items-center justify-center">
      <span className="text-[10px] text-muted-foreground/40 font-mono">No history</span>
    </div>
  );
  const prices = pts.map(p => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || min * 0.02 || 1;
  const W = 200, H = 56, PAD = 5;
  const coords = prices.map((p, i) => ({
    x: (i / (prices.length - 1)) * W,
    y: H - PAD - ((p - min) / range) * (H - PAD * 2),
  }));
  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `M0,${H} ${coords.map(c => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")} L${W},${H} Z`;
  const last = coords[coords.length - 1];
  const color = positive ? "#34D399" : "#F87171";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 56 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.4" />
          <stop offset="90%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="3" fill={color} />
      <circle cx={last.x.toFixed(1)} cy={last.y.toFixed(1)} r="5" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

function ItemCard({ item, tags, onClick, onToggleFavorite }) {
  const mainSrc = item.sources.find(s => s.isMain) ?? item.sources[0];
  const itemTags = tags.filter(t => item.tagIds.includes(t.id));
  const [imgErr, setImgErr] = useState(false);
  const gradId = useMemo(() => `sg-${item.id}`, [item.id]);

  const history = mainSrc?.priceHistory ?? [];
  const firstPrice = history.length > 1 ? history[0].price : null;
  const currentPrice = mainSrc?.currentPrice ?? null;
  const pctChange = firstPrice && currentPrice
    ? ((currentPrice - firstPrice) / firstPrice) * 100
    : null;
  const isPositive = (pctChange ?? 0) >= 0;
  const host = mainSrc ? hostname(mainSrc.url) : null;

  return (
    <div
      onClick={onClick}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer
        hover:border-primary/50 hover:shadow-[0_0_28px_rgba(139,92,246,0.2)] transition-all duration-300"
    >
      {/* Header */}
      <div className="relative flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
          {item.imageUrl && !imgErr ? (
            <img src={item.imageUrl} alt={item.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Package className="w-5 h-5 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-7">
          <div className="font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-1.5">{item.name}</div>
          <div className="flex flex-wrap gap-1">
            {itemTags.slice(0, 2).map(t => <TagBadge key={t.id} tag={t} />)}
            {itemTags.length > 2 && <span className="text-[10px] text-muted-foreground self-center font-mono">+{itemTags.length - 2}</span>}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm
            flex items-center justify-center hover:bg-background transition-colors border border-border/60
            group-hover:border-primary/30"
        >
          <Star className="w-3.5 h-3.5 transition-colors"
            fill={item.isFavorite ? "#FBBF24" : "none"}
            stroke={item.isFavorite ? "#FBBF24" : "currentColor"} />
        </button>
      </div>

      {/* Sparkline zone */}
      <div className="relative">
        <div className="flex items-center justify-between px-4 mb-1">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">30d trend</span>
          {pctChange !== null && (
            <span className={`flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
              isPositive ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{pctChange.toFixed(1)}%
            </span>
          )}
        </div>
        <Sparkline data={history} gradId={gradId} positive={isPositive} />
      </div>

      {/* Footer */}
      <div className="px-4 pt-2.5 pb-3.5 border-t border-border/50 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {currentPrice != null ? (
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-bold text-primary leading-none">{fmt(currentPrice, mainSrc.currency)}</span>
              <span className="text-xs text-muted-foreground font-mono">{mainSrc.currency}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">No price yet</span>
          )}
          <div className="flex items-center gap-2 mt-1">
            {host && <span className="text-[10px] text-muted-foreground/70 font-mono truncate max-w-[110px]">{host}</span>}
            {mainSrc?.lastScraped && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 font-mono shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {timeAgo(mainSrc.lastScraped)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono shrink-0 border border-border/50">
          <Link2 className="w-2.5 h-2.5" />
          {item.sources.length}
        </div>
      </div>
    </div>
  );
}
```

---

## Critical Implementation Notes

1. **SVG gradient ID uniqueness.** Each card renders its own `<linearGradient>`. If multiple cards share the same `id`, later definitions overwrite earlier ones and all cards will use the last color. Always derive the ID from a stable unique field: `useMemo(() => \`sg-${item.id}\`, [item.id])`.

2. **`preserveAspectRatio="none"` is required.** Without it the SVG will letterbox and refuse to fill the card width.

3. **`overflow-hidden` on the card shell** is what makes the sparkline SVG appear to bleed edge-to-edge. The SVG itself has no horizontal padding; padding only appears in the trend label row above it.

4. **`e.stopPropagation()` on the favorite button** prevents the card's `onClick` from firing when the star is clicked. Never omit this.

5. **Flat price data guard.** If all prices are identical, `range = 0`. The guard `max - min || min * 0.02 || 1` handles three cases: normal variance, a flat non-zero price, and a zero price.

6. **Image error fallback.** The `<img onError>` pattern is essential. External image URLs frequently fail; the gradient placeholder must render cleanly with no broken-image icon.
