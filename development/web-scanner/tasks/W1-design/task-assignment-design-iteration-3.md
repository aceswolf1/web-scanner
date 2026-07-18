# Task Assignment: W1-design — Design Iteration 3

**Worker**: worker-1
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Type**: Single targeted fix — Draft 2 sparkline full-width

---

## Context

The product card sparkline graph is currently cropped/contained — it does NOT stretch edge-to-edge across the full card width. This must be fixed.

**Reference image (GOOD)**: `initial-requirements/Screenshot 2026-07-15 at 11.51.00 AM.png`
**Current broken image**: `initial-requirements/Screenshot 2026-07-15 at 12.07.55 PM.png`

Read both images with the Read tool before writing the prompt.

**Spec reference**: `initial-requirements/ProductCard.md` — read section "Zone 2 — Sparkline".

Key rules from the spec:
- The SVG sparkline container has **ZERO horizontal padding** — no `px-4` or any left/right margin
- The SVG uses `preserveAspectRatio="none"` and `width: 100%` so it stretches to fill the full card width
- The card shell has `overflow-hidden` which clips the SVG flush to the card edges — this is what makes the line appear to "bleed" to both edges
- ONLY the trend label row above the SVG has `px-4` horizontal padding
- The result: the graph line and gradient fill touch the very left and right edges of the card

---

## Task — Iterate Draft 2 (Item List — sparkline fix only)

**Draft ID**: `cf66c314-b9a0-4186-afd6-2e191eb4f238`
**Mode**: replace

Fix ONLY the sparkline — do NOT change anything else on this screen (no layout changes, no color changes, no grid changes, no footer changes, no header changes).

Command:
```bash
npx --yes @superdesign/cli@latest iterate-design-draft \
  --draft-id cf66c314-b9a0-4186-afd6-2e191eb4f238 \
  --mode replace \
  --user-request "Sparkline graph must be full card width, bleeding edge-to-edge with no horizontal margins" \
  -p "Fix ONLY the sparkline chart on each product card — change nothing else. The sparkline SVG area chart must stretch the FULL WIDTH of the card with zero horizontal padding or margins, bleeding flush to the left and right card edges (the card's overflow-hidden clips it cleanly). The card has overflow-hidden which clips the SVG. The SVG itself uses preserveAspectRatio none and width 100% so it fills 100% of the card width. Only the trend label row above the sparkline ('30d trend' label + percentage badge) has horizontal padding (px-4). The sparkline SVG container itself has NO padding. Result: the coral/pink gradient fill and the trend line should touch the very left and right edges of the card with no gap. Reference the good card design from the screenshot — the graph fills the entire width, the line starts at the left edge and ends at the right edge of the card. Do NOT change the grid layout, card header, card footer, color palette, sidenav, search bar, or any other element. Use ONLY the fonts, colors, spacing, and component styles defined in the design system." \
  --context-file .superdesign/design-system.md
```

---

## After completion

1. Write updated URL to `development/web-scanner/tasks/W1-design/iteration-3-report.md`
2. Send: `COMPLETE: Design iteration 3 done. Draft 2 updated. URL in iteration-3-report.md.`
