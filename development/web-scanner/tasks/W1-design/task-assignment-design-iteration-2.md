# Task Assignment: W1-design — Design Iteration 2

**Worker**: worker-1
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Type**: Targeted redesign of Draft 2 (cards) and Draft 4 (detail view)

---

## Reference Images (READ THESE FIRST)

The user provided three reference screenshots. Their exact paths:
- `initial-requirements/Screenshot 2026-07-15 at 11.47.19 AM.png` — BROKEN current detail view (what NOT to have)
- `initial-requirements/Screenshot 2026-07-15 at 11.51.00 AM.png` — CARD REFERENCE (copy this layout exactly)
- `initial-requirements/Screenshot 2026-07-15 at 11.52.43 AM.png` — DETAIL VIEW REFERENCE (copy this layout exactly)

Read all three images with the Read tool before writing any prompts, so you can reference exact details.

---

## Task A — Iterate Draft 2 (Item List — card layout + 3-column grid)

**Draft ID**: `cf66c314-b9a0-4186-afd6-2e191eb4f238`
**Mode**: replace

**Changes**:

1. **3-column grid**: Change the product card grid from its current layout to 3 columns.

2. **Card layout — copy reference 11.51.00 EXACTLY**:
   - TOP of card: square product image/avatar (rounded corners, ~80×80px) on the LEFT. To the right of the avatar: product name (bold, large) on top, tag chips below the name (e.g. "Electronics", "Gaming" in rounded pill chips). Gold filled star icon in the very top-right corner of the card.
   - MIDDLE of card: "30D TREND" label in small muted uppercase on the left. On the right side of that row: a trend percentage badge (e.g. "↘ -0.7%" in a subtle chip — red/rose for negative, green for positive). Below this label: a full-width sparkline/area chart for the 30-day trend of the main source — pink/coral gradient fill, glowing line, no axes labels, just the trend shape.
   - BOTTOM of card: Main price large and bold on the left (e.g. "$1250.34 USD"). Below the price: source domain name (e.g. "amazon.com") + clock icon + "Just now" timestamp in muted small text. On the bottom-right: a "↔ 3" sources count badge (number of sources being tracked).

Command:
```bash
npx --yes @superdesign/cli@latest iterate-design-draft \
  --draft-id cf66c314-b9a0-4186-afd6-2e191eb4f238 \
  --mode replace \
  --user-request "3-column grid, redesign cards to match reference: image avatar left, name+tags right, 30D trend sparkline, price bottom-left, sources count bottom-right" \
  -p "Two changes to the item list screen: (1) GRID: Change to a 3-column product card grid. (2) CARD LAYOUT — redesign each card to match this exact layout: TOP SECTION: Square product image avatar (80×80px, rounded corners) on the far left. To its right: product name in bold large text, and below the name: category tag chips (pill-shaped, e.g. 'Electronics' 'Gaming'). Gold filled star icon pinned to the top-right corner of the card. MIDDLE SECTION: A row with 'TREND 30D' in small muted uppercase caps on the left, and a trend percentage badge (e.g. '↘ -0.7%') in a subtle chip on the right (rose-red for negative, emerald for positive). Below this row: a full-width sparkline area chart showing the 30-day price trend of the main source — coral/pink gradient area fill with a glowing line on top, no axis labels, compact height (~70px). BOTTOM SECTION: Main price in large bold monospace text on the left (e.g. '$1250.34 USD'). Below the price in smaller muted text: the source domain (e.g. 'amazon.com') with a clock icon and 'Just now' timestamp. On the bottom-right: a pill badge showing the number of sources (e.g. '↔ 3'). Do NOT change the search bar, header, color palette, sidenav, or any other element outside the cards. Use ONLY the fonts, colors, spacing, and component styles defined in the design system." \
  --context-file .superdesign/design-system.md
```

---

## Task B — Iterate Draft 4 (Item Detail — full layout restore)

**Draft ID**: `db482470-fca3-4a95-b119-80bdfaacb5d8`
**Mode**: replace

The previous iteration broke the detail view layout. This task restores it to the correct layout shown in reference screenshot `11.52.43 AM.png`. The key structural rule: **ONE comparison graph only — drop all per-source individual graphs.**

**Target layout (top to bottom) — copy reference 11.52.43 EXACTLY**:

1. **Breadcrumb**: "← All Products" small link at the very top of the content area.

2. **Product header row**: 
   - LEFT: Square product image (~90×90px, rounded corners)
   - RIGHT of image: Product name in large bold (e.g. "ASUS ROG Zephyrus G14"), below it tag chips (e.g. "Electronics" "Gaming") + "3 sources" count in muted text on the same row as chips
   - Below name+chips: Main price in violet large monospace (e.g. "$1250.34") + "USD" label + "· main" label
   - TOP-RIGHT of header: action icon buttons in a row: star (gold filled = favorited), pencil (edit), "Scrape All" button (violet filled with refresh icon), trash (delete)

3. **Price History Chart** (full width card, below header):
   - Title "Price History — 30 days" on the left (bold white)
   - "Display in [USD ▾]" dropdown on the right
   - Multi-line chart: each source is a different colored line (violet, cyan, amber/yellow)
   - Y-axis: price values with $ prefix ($0, $350, $700, $1050, $1400)
   - X-axis: dates MM-DD format (06-15, 06-17 ... 07-15)
   - Subtle dot/grid background
   - Legend at bottom: colored dot + source domain (e.g. "○ amazon.com", "○ bestbuy.com", "○ newegg.com")
   - Hover tooltip shows date + price per source

4. **Sources section** (below the chart card):
   - Section header "Sources" on the left + "+ Add Source" button on the right
   - 2-column grid of source cards. Each source card contains:
     - TOP of card: "MAIN" badge (violet filled pill, only on the main source) + domain name (e.g. "amazon.com") bold. On the right side: refresh icon, star icon, trash icon
     - URL row: external link icon + full URL as a clickable link (e.g. "https://amazon.com/asus-rog-g14")
     - Price row: price in large bold (e.g. "$1250.34") + "USD ▾" currency dropdown pill
     - CSS selector row: a monospace code chip showing the CSS selector (e.g. ".a-price → .a-price-whole" or ".priceView-customer-price" or "CSS: '.price-current strong'") — use a dark chip with monospace font
     - Timestamp: clock icon + "1m ago"

5. **NO per-source individual price history graphs** — remove them entirely. Only the ONE comparison chart at the top.

Command:
```bash
npx --yes @superdesign/cli@latest iterate-design-draft \
  --draft-id db482470-fca3-4a95-b119-80bdfaacb5d8 \
  --mode replace \
  --user-request "Restore correct detail layout: header with image+name+price+actions, ONE comparison graph below, sources section in 2-col grid below graph, drop per-source graphs" \
  -p "Completely restore the item detail screen to the correct layout — the previous iteration broke it. TARGET LAYOUT (top to bottom): (1) BREADCRUMB: '← All Products' small muted link. (2) PRODUCT HEADER: Square product image (~90px, rounded) on left. Right of image: product name large bold, below it tag chips + '3 sources' in muted text on same line. Below that: main price in large violet monospace (e.g. '$1250.34') + 'USD' + '· main' label. Top-right of header section: icon buttons in a row — star (gold filled), pencil, 'Scrape All' (violet filled button with refresh icon), trash icon. (3) PRICE HISTORY CHART (full-width card below header): 'Price History — 30 days' title left, 'Display in [USD ▾]' dropdown right. Multi-line chart with one colored line per source (violet, cyan, amber). Y-axis: $ price values. X-axis: MM-DD dates. Dot grid background. Source legend at bottom. Hover tooltip. (4) SOURCES SECTION (below chart): 'Sources' heading left, '+ Add Source' button right. 2-column grid of source cards. Each source card: MAIN badge (violet pill, only on main source) + domain bold + action icons (refresh, star, trash) in top row. URL row with external link. Price + currency dropdown. CSS selector in a dark monospace chip (e.g. '.a-price → .a-price-whole'). Clock + timestamp. CRITICAL: Remove ALL per-source individual price history graphs — only the ONE comparison chart exists. Use ONLY the fonts, colors, spacing, and styles from the design system." \
  --context-file .superdesign/design-system.md
```

---

## Execution Order

Run A first, then B. They are independent but do them in order.

After both complete:
1. Write updated URLs to `development/web-scanner/tasks/W1-design/iteration-2-report.md`
2. Send: `COMPLETE: Design iteration 2 done. Drafts 2 and 4 updated. URLs in iteration-2-report.md.`

---

## Important Notes

- Read all three reference screenshots with the Read tool FIRST before writing any CLI prompts
- Use `--mode replace` for both — targeted fixes, not explorations  
- Always pass `--context-file .superdesign/design-system.md`
- The goal is to match the reference screenshots as closely as possible in structure and layout
- Draft 5 (Favorites) does NOT need changes this iteration
