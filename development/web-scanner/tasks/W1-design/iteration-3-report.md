# W1-design — Iteration 3 Report

**Worker**: worker-1
**Project root**: `/Users/cace/Desktop/cloud-copy/projects/web-scanner-04`
**Type**: Single targeted fix — Draft 2 sparkline full-width bleed

---

## Summary

Draft 2 (Item List) iterated a single targeted fix: the product-card sparkline graph no longer has horizontal padding/margins — it now bleeds edge-to-edge across the full card width.

- **References read first**:
  - `Screenshot 2026-07-15 at 11.51.00 AM.png` — GOOD card reference (sparkline fills card width)
  - `Screenshot 2026-07-15 at 12.07.55 PM.png` — CURRENT BROKEN card reference (sparkline centered with horizontal margins)
  - `initial-requirements/ProductCard.md` — section "Zone 2 — Sparkline" confirmed the implementation rules
- **Mode**: `--mode replace` — single targeted fix, nothing else changed.
- **Credits used**: 6.5

---

## Updated Draft

| Screen | Draft ID | New Title | Preview URL | Credits |
|--------|----------|-----------|-------------|---------|
| Item List + Search | `cf66c314-b9a0-4186-afd6-2e191eb4f238` | Full-Width Sparkline Update | https://p.superdesign.dev/draft/cf66c314-b9a0-4186-afd6-2e191eb4f238 | 6.5 |

**Project**: `51d314e0-030d-47e0-98fe-ede2aea4082d` (unchanged)

---

## The Fix

**Before** (broken — `12.07.55 PM.png`): The sparkline SVG chart was rendered inside a container with `padding-left` / `padding-right` (or left/right margin), causing the trend line and gradient fill to sit in the middle of the card with horizontal gaps on both sides.

**After** (fixed — matches `11.51.00 AM.png`): The SVG sparkline container has **zero horizontal padding**. The SVG itself uses `preserveAspectRatio="none"` + `width: 100%` so it stretches to fill the full card width. The card shell's `overflow-hidden` clips the SVG flush to both edges — this is what makes the line appear to "bleed" left and right. Only the trend label row above the SVG (`30D TREND` + percentage badge) retains horizontal padding (`px-4`).

Rules from `ProductCard.md` Zone 2 that were applied:
1. ✅ SVG container: no left/right padding (no `px-4`, no `mx-*`).
2. ✅ SVG attributes: `preserveAspectRatio="none"` + `width: 100%` → fills 100% of card width.
3. ✅ Card shell: `overflow-hidden` clips the SVG flush to edges.
4. ✅ Only the trend label row above the SVG keeps its `px-4` padding.
5. ✅ Result: gradient fill and trend line touch the very left and right edges of the card.

Did NOT change: 3-column grid, card header (image / name / tags / favorite star), card footer (price / source meta / sources count badge), the coral/pink gradient color, the search bar, header, sidenav, topbar, or any other element.

---

## Notes for Implementation Phase (for the `Sparkline` component)

These were the exact rules from the spec; implementation should mirror them in the actual code:

```css
/* Card shell */
.card { overflow: hidden; }   /* the clip that makes the SVG bleed */

/* Sparkline zone wrapper */
.sparkline-zone { /* NO horizontal padding */ }

/* Trend label row (above SVG) */
.trend-row { padding-inline: 1rem; }   /* px-4 — only this row has padding */

/* The SVG itself */
svg.sparkline {
  width: 100%;
  height: 56px;   /* fixed; don't vary by data */
  preserveAspectRatio: none;
}
```

Common pitfalls to avoid:
- Wrapping the SVG in a flexbox column that gives it auto horizontal margin → bleeds. Put the SVG in a plain `div` with no padding/margin.
- Setting `preserveAspectRatio="xMidYMid meet"` (default) → SVG letterboxes, doesn't fill width.
- Using a charting library that adds its own internal padding/axes container → use a raw SVG (per the spec) for the card sparkline. The larger comparison chart in the detail view can still use Chart.js.

---

## Issues Encountered

- None. Single `iterate-design-draft --mode replace` call succeeded on first attempt.

**Status: Iteration 3 complete. Sparkline fix applied.**