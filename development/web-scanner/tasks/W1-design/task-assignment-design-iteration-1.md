# Task Assignment: W1-design — Design Iteration 1

**Worker**: worker-1
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Type**: Targeted design iterations — mode: replace (do NOT change anything beyond what is listed)

---

## Context

The user reviewed all 5 drafts and requested specific targeted changes. Apply ONLY the changes listed below — do not redesign, recolor, or restructure anything else.

**Existing draft IDs** (read from completion-report.md if needed):
- Draft 2 — Item List + Search: `cf66c314-b9a0-4186-afd6-2e191eb4f238`
- Draft 4 — Item Detail + Charts: `db482470-fca3-4a95-b119-80bdfaacb5d8`
- Draft 5 — Favorites Section: `39d6af58-1286-41ca-b48a-94de4e41fce9`

**Design system**: `.superdesign/design-system.md`

---

## Task A — Iterate Draft 2 (Item List cards)

Three targeted additions to each product card. Use `--mode replace`.

**Changes** (do NOT change anything else on this screen):
1. **Mini graph on card**: Below the "N sources monitored" subtitle, add a small sparkline/mini-line-chart showing the price history of the main source. The graph should be compact (card-width, ~60–80px tall), showing the price trend line with the violet stroke and a subtle area fill — same style as the detail view charts but miniaturized. No axes labels on this mini version (space-constrained), just the trend line.
2. **Currency label**: Show the main source's currency as a small chip/badge on the card (e.g., "USD" in a subtle violet outline chip), near the main price.
3. **Favorite star**: Add a star icon button on the top-right corner of each card. Filled gold star = favorited, outlined star = not favorited. One card in the design should show as favorited (filled star) to demonstrate the state.

Card layout order (top to bottom):
- Card title: e.g., "Nvidia RTX 4090"
- Subtitle: "4 sources monitored"
- Mini graph (NEW — main source price history sparkline)
- Main price + currency chip
- "Updated 12m ago" timestamp
- Favorite star (top-right corner, overlaid)

Command:
```bash
npx --yes @superdesign/cli@latest iterate-design-draft \
  --draft-id cf66c314-b9a0-4186-afd6-2e191eb4f238 \
  --mode replace \
  --user-request "Add mini price history graph to cards, show currency, add favorite star toggle" \
  -p "Add three targeted elements to each product card — do NOT change any other part of this screen. (1) MINI GRAPH: Below the 'N sources monitored' text, add a compact sparkline chart (~60-80px tall, full card width) showing the main source price history trend. Violet stroke, subtle area fill, no axis labels — just the trend line. (2) CURRENCY CHIP: Next to the main price, add a small outlined chip showing the currency code (e.g. 'USD', 'EUR'). (3) FAVORITE STAR: Top-right corner of each card, a star icon button — gold filled = favorited, outlined = not favorited. Show at least one card with a filled gold star. Card layout order: title → 'N sources monitored' → mini graph → price + currency chip → 'Updated Xm ago' → star (overlaid top-right). Use ONLY the fonts, colors, spacing, and component styles defined in the design system. Do not change the search bar, header, layout, colors, or any other element." \
  --context-file .superdesign/design-system.md
```

---

## Task B — Iterate Draft 4 (Item Detail)

Four targeted changes. Use `--mode replace`.

**Changes** (do NOT change anything else on this screen):
1. **Comparison graph at top**: Add a full-width "Price History — 30 days" multi-line chart as the FIRST element inside the item detail content area (above the per-source cards). It shows all sources on one chart, each as a different colored line. Matches the reference screenshot exactly:
   - Dark card background, full width
   - Title "Price History — 30 days" on the left (bold, white)
   - "Display in [USD ▾]" dropdown on the top-right (currency selector to normalize all prices)
   - Y-axis: price values with $ prefix (e.g. $0, $400, $800, $1200, $1600) — left side, light muted text
   - X-axis: dates in MM-DD format (e.g. 06-15, 06-17 ... 07-15) — bottom, light muted text
   - Each source = its own colored line (purple for source 1, cyan for source 2, amber/yellow for source 3)
   - Subtle dot grid background inside the chart area
   - Legend below the chart: colored dot + source domain name (e.g. "○ amazon.com", "○ bestbuy.com")
   - Hover tooltip showing date + price per source at that point
2. **Fix per-source graph axes**: On each existing per-source price history chart (keep them, do not remove), add visible X-axis (dates, MM-DD format) and Y-axis (price values with currency symbol). Currently they show no axis labels.
3. **Hover tooltip on all graphs**: Both the comparison graph and per-source graphs should show a hover tooltip displaying the exact price value and date when the user hovers over the chart line.
4. **CSS selector on each source card**: On each source card (the individual source rows), add a small code snippet display showing the CSS selector used. Format: a monospace chip or inline code block showing e.g. `.price` or `.product-price > span` or `#price-box`. Label it "Selector:" in muted text. Place it below the URL line, above the last-scraped timestamp.

Command:
```bash
npx --yes @superdesign/cli@latest iterate-design-draft \
  --draft-id db482470-fca3-4a95-b119-80bdfaacb5d8 \
  --mode replace \
  --user-request "Add comparison graph at top, fix graph axes with labels, add hover tooltips, show CSS selector on each source" \
  -p "Add four targeted elements to the item detail screen — do NOT change any other part. (1) COMPARISON GRAPH: Add a full-width multi-line price history chart as the first element in the content area, before the per-source cards. Dark card, title 'Price History — 30 days' (left) + 'Display in [USD ▾]' dropdown (right). Y-axis shows price values with $ prefix. X-axis shows dates in MM-DD format. Each source is a different colored line (violet, cyan, amber). Subtle dot grid background. Legend below with colored dot + source domain. Hover tooltip shows date + price per source. (2) FIX PER-SOURCE GRAPHS: On each existing per-source chart, add Y-axis (price values) and X-axis (MM-DD dates). Keep the charts — do not remove them. (3) HOVER TOOLTIPS: All charts (comparison + per-source) show a tooltip on hover with exact price and date. (4) CSS SELECTOR: On each source card, below the URL, add a 'Selector:' label in muted text followed by a monospace code chip showing the CSS selector (e.g. '.price' or '.product-price > span'). Use ONLY the fonts, colors, spacing, and component styles defined in the design system. Do not change layout, colors, favorite star, scrape button, or any other element." \
  --context-file .superdesign/design-system.md
```

---

## Task C — Iterate Draft 5 (Favorites Section)

Two targeted changes. Use `--mode replace`.

**Changes**:
1. **Make favorites accessible from sidenav**: Ensure the sidenav (visible on this screen) shows a "Favorites" link/item under Pricing Tracker (indented, with a gold star icon), clearly indicating it is a navigable section.
2. **Show favorite star state on cards**: Each card in the Favorites section should have the gold filled star (since all items here are favorited). Make sure it's clearly visible.

Command:
```bash
npx --yes @superdesign/cli@latest iterate-design-draft \
  --draft-id 39d6af58-1286-41ca-b48a-94de4e41fce9 \
  --mode replace \
  --user-request "Show favorites in sidenav, ensure favorite star is visible and filled on all cards" \
  -p "Two targeted fixes only — do NOT change anything else. (1) SIDENAV FAVORITES LINK: In the left sidenav, under the 'Pricing Tracker' module entry, add an indented sub-item 'Favorites' with a gold filled star icon. It should be clearly visible and look like a navigable link, with the active/highlighted state since we are on that page. (2) FAVORITE STAR ON CARDS: Each product card in this Favorites section must show a gold filled star icon in the top-right corner (since all items here are favorited by definition). Make sure the star is clearly visible against the card background. Use ONLY the fonts, colors, spacing, and component styles defined in the design system. Do not change any other element." \
  --context-file .superdesign/design-system.md
```

---

## Execution Order

Run A → B → C sequentially (each is independent but do them in order to stay organized).

After all three complete:
1. Write updated draft URLs to `development/web-scanner/tasks/W1-design/iteration-1-report.md`
2. Send: `COMPLETE: Design iteration 1 done. 3 drafts updated. URLs in iteration-1-report.md.`

---

## Important

- Use `--mode replace` for all three — these are targeted fixes, not explorations
- Always pass `--context-file .superdesign/design-system.md`
- Do NOT use `iterate-design-draft --mode branch` — we are not creating variations
- Do NOT change anything beyond what is explicitly listed above
- The CLI is available as `npx --yes @superdesign/cli@latest` or `superdesign`
