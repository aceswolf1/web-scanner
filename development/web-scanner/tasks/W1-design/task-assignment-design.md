# Task Assignment: W1-design

**Worker**: worker-1
**Role**: Design Agent (superdesign Brand New Project SOP)
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: 1 — Design (gate before implementation)

## Your Job

Generate UI design drafts for the Web Scanner Pricing Tracker using the superdesign CLI. You are working on a **brand new greenfield project** — no existing codebase to analyze. Follow the **SOP: BRAND NEW PROJECT** workflow from the superdesign skill.

**CRITICAL**: Do NOT write any implementation code. Your only deliverable is design drafts in superdesign.

---

## Task IDs (update these as you work)

- **T1** = Task #1 — Search style prompts + design-system.md
- **T2** = Task #2 — Create project + app shell draft
- **T3** = Task #3 — Flow pages for remaining screens

Call `TaskUpdate(taskId: "1", status: "in_progress", owner: "worker-1")` immediately when starting T1.

---

## Context: What You're Designing

**Product**: Web Scanner — a modular web price-scraper app
**First module**: Pricing Tracker

**Visual requirements**:
- Futuristic purple/violet palette — violet as primary color, surface-mist for backgrounds
- PrimeVue Material component aesthetic (cards, dialogs, data tables, chips)
- Dark AND light theme (design both states — dark preferred as the primary view)
- High contrast ratio ≥ 4.5:1
- Sidenav listing modules (only "Pricing Tracker" for now)

**Screens to design (5 total)**:

1. **App Shell** — persistent layout: left sidenav with module list + active state, top bar with dark/light toggle button, main content area placeholder
2. **Item List** — grid/list of product cards (name, source count, main price badge), search bar (filters by name / source URL / tags), tag filter chips, empty state
3. **Create Item Modal** — name field, image URL or file upload, tag multi-select + create-new-tag option, source repeater (each row: URL, currency dropdown [USD/EUR/GBP/JPY/CAD/MXN/COP], price class field, CSS rule field, father class field, main-price radio), "Add Source" button, Okay / Cancel actions
4. **Item Detail Screen** — item name + edit/delete actions, favorite star, per-source cards (URL link, currency, last-scraped timestamp, "Scrape now" button, currency-conversion dropdown), price history line chart per source
5. **Favorites Section** — same grid as item list but showing only favorited items, empty state with star icon

---

## Step-by-Step Workflow

### T1: Design System (Task #1)

1. `TaskUpdate(taskId: "1", status: "in_progress", owner: "worker-1")`
2. Create `.superdesign/` directory in project root if it doesn't exist
3. Search for style prompts:
   ```bash
   npx --yes @superdesign/cli@latest search-prompts --tags "style"
   ```
4. Review the returned slugs. Pick the one that best matches "futuristic, violet, dark, high-tech, premium dashboard". Good candidates: anything with "dark", "neon", "futuristic", "space", "tech" in the name.
5. Fetch the index first (do NOT use --full yet):
   ```bash
   npx --yes @superdesign/cli@latest get-prompts --slugs "<chosen-slug>"
   ```
6. Then fetch full body:
   ```bash
   npx --yes @superdesign/cli@latest get-prompts --slugs "<chosen-slug>" --full
   ```
7. Write `.superdesign/design-system.md` at project root. It MUST include all of:
   - **Product context**: Web Scanner — modular price tracking SaaS tool; Pricing Tracker is the first module; power-user dashboard feel
   - **Color palette**: violet primary (e.g. #7C3AED or PrimeVue violet), surface-mist background for light theme, deep slate/near-black for dark theme, accent colors for price-up/price-down indicators (green/red)
   - **Typography**: clean sans-serif (Inter or Geist), weight hierarchy: 700 headings, 500 labels, 400 body
   - **Spacing**: 4px base grid, generous padding on cards
   - **Components**: card with subtle border + shadow, modal/dialog with backdrop blur, data table rows, chip/badge for tags and currency labels, line chart styling
   - **Dark/light theme tokens**: explicitly define both
   - **Motion**: subtle transitions (150ms ease-in-out for theme toggle, card hover lift)
   - **Futuristic touches**: subtle glows on primary CTAs, gradient accents, grid/dot background option for hero areas
8. `TaskUpdate(taskId: "1", status: "completed")`

### T2: Project + App Shell (Task #2)

1. `TaskUpdate(taskId: "2", status: "in_progress", owner: "worker-1")`
2. Ensure `.superdesign/tmp/` exists. Add `.superdesign/tmp/` to `.gitignore` if the file exists (create `.gitignore` if not):
   ```
   .superdesign/tmp/
   ```
3. Create the superdesign project:
   ```bash
   npx --yes @superdesign/cli@latest create-project --title "Web Scanner — Pricing Tracker"
   ```
   Record the project ID from the output.
4. Create the initial design draft (app shell — single -p only):
   ```bash
   npx --yes @superdesign/cli@latest create-design-draft \
     --project-id <project-id> \
     --title "App Shell — Sidenav + Theme Toggle" \
     --user-request "Design the app shell for a futuristic web price-scraper called Web Scanner" \
     -p "Design a futuristic dark-mode web app shell for 'Web Scanner', a price tracking tool. LEFT SIDEBAR: fixed-width (~240px), dark violet/slate background, app logo top (text logo 'WS' or spider icon), module navigation item 'Pricing Tracker' with a tag/price icon and active highlight in violet, settings icon at bottom. TOP BAR: full width, glassmorphism style, page title on left, dark/light theme toggle button on right (sun/moon icon). MAIN CONTENT: placeholder content area with subtle grid dot background and a centered 'Select a module' prompt. Color palette: violet primary (#7C3AED), dark surface (#0F0F1A), card surfaces (#1A1A2E), muted text (#A0A0B8). Futuristic feel: subtle glow on active nav item, gradient accent line at top of sidebar. Use ONLY the fonts, colors, spacing, and styles defined in the design system." \
     --context-file .superdesign/design-system.md
   ```
   Record the draft ID from the output.
5. Write IDs to progress-report.md (see below).
6. `TaskUpdate(taskId: "2", status: "completed")`

### T3: Flow Pages (Task #3)

1. `TaskUpdate(taskId: "3", status: "in_progress", owner: "worker-1")`
2. Using the draft ID from T2, generate the remaining 4 screens with execute-flow-pages:
   ```bash
   npx --yes @superdesign/cli@latest execute-flow-pages \
     --draft-id <draft-id-from-T2> \
     --context-file .superdesign/design-system.md \
     --pages '[
       {
         "title": "Item List + Search",
         "prompt": "Pricing Tracker main view: a responsive grid of product cards. Each card shows product name (bold), number of sources (e.g. \"3 sources\"), and main price in a violet badge. TOP: search bar spanning full width (searches name/URL/tags), tag filter chips row below it. Empty state shows a large plus icon and \"Add your first product\" message. HEADER: \"Pricing Tracker\" title with an \"Add Product\" button (violet, filled). Use the app shell layout from the parent draft (sidenav + topbar). Futuristic card style: subtle violet border glow on hover, glassmorphism on card surface. Use ONLY the fonts, colors, spacing, and styles defined in the design system."
       },
       {
         "title": "Create Item Modal",
         "prompt": "Modal dialog for creating a new product item, shown over the Item List screen. MODAL HEADER: \"Add New Product\" title + X close button. FIELDS: Product Name (text input, required), Image (two tabs: URL input / File upload with drag-drop zone). Tags section: multi-select chip input with existing tags shown as chips + \"Create new tag\" option. SOURCE REPEATER: a labeled section \"Sources\" with a repeatable row, each row containing: URL (text input, wide), Currency (dropdown: USD/EUR/GBP/JPY/CAD/MXN/COP, compact), Price Class (text input, placeholder \".price\"), CSS Rule (text input, optional), Father Class (text input, optional), Main Price (radio button — only one selectable). An \"+ Add Source\" text button below the rows. FOOTER: Cancel (outlined) + Okay (violet filled) buttons. Warn badge visible if multiple elements found. Use ONLY the fonts, colors, spacing, and styles defined in the design system."
       },
       {
         "title": "Item Detail — Sources + Charts",
         "prompt": "Item detail screen (full page, within app shell). HEADER: product name in large type, star/favorite toggle icon, Edit and Delete action buttons. PRICE SOURCES section: each source rendered as a card. Source card contains: URL (clickable link with external icon), currency label chip, last-scraped timestamp (\"Last scraped 2h ago\"), currency-conversion dropdown (shows price in selected currency, display only), \"Scrape Now\" button (outlined violet). Below each source card: a line chart showing price history for that source over time (x-axis = dates, y-axis = price, violet line with area fill). Charts use recharts/chart aesthetic. ADD SOURCE button at bottom. Use ONLY the fonts, colors, spacing, and styles defined in the design system."
       },
       {
         "title": "Favorites Section",
         "prompt": "Favorites section (same layout as Item List but filtered to starred items). HEADER: \"Favorites\" title with a gold/yellow star icon. Shows the same product card grid as Item List. Empty state: large star outline icon, text \"No favorites yet — star an item to pin it here\". The sidenav shows a \"Favorites\" subsection under Pricing Tracker (indented, star icon). Use ONLY the fonts, colors, spacing, and styles defined in the design system."
       }
     ]'
   ```
3. Collect all returned draft URLs from the output.
4. Write completion-report.md (see below).
5. `TaskUpdate(taskId: "3", status: "completed")`
6. Send: `COMPLETE: Design phase done. All 5 screens generated. Draft URLs listed in completion-report.md.`

---

## Files to Write

### `development/web-scanner/tasks/W1-design/progress-report.md`

Update after each task. Include:
- Current task status
- Superdesign project ID (once created)
- Draft IDs created so far
- Any issues encountered

### `development/web-scanner/tasks/W1-design/completion-report.md`

Write after T3 completes. Include:
- Superdesign project ID
- All 5 draft titles + draft IDs + URLs
- Design system highlights (palette, typography chosen)
- Link to `.superdesign/design-system.md`
- Notes for implementation phase (key design decisions)

---

## Reporting Protocol

- Update `progress-report.md` after completing each task
- Use `TaskUpdate` to move each task to `in_progress` before starting, `completed` after finishing
- After T3 completes: write `completion-report.md` then send `COMPLETE:` message to orchestrator
- If you hit an error: write the error to `progress-report.md`, send `BLOCKED: <description>` to "main"

---

## Important Notes

- This is a **brand new project** — no existing UI to reproduce. Follow SOP: BRAND NEW PROJECT, NOT SOP: EXISTING UI
- Skip Step 2.5 (component extraction) — no existing components to extract
- The `create-design-draft` command accepts ONLY ONE -p. All design direction goes in that single prompt
- After T2, use `execute-flow-pages` (NOT `create-design-draft`) for the remaining screens
- Always pass `--context-file .superdesign/design-system.md` on every design command
- The superdesign CLI is already installed globally: run `superdesign <command>` OR `npx --yes @superdesign/cli@latest <command>` — both work
- You are already logged in to superdesign (user confirmed login)
