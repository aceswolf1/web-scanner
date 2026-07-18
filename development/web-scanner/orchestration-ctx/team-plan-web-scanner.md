# Team Plan: web-scanner

## Phase 1 — Design (CURRENT PHASE — gate before implementation)

**Goal**: Generate UI drafts for all Pricing Tracker screens via superdesign. User approves before implementation starts.

### W1-design (pt-frontend-eng)

**Role**: Design worker using superdesign Brand New Project SOP

**Sequential tasks** (each blocks the next):

| Task ID | Task | Complexity | Deliverable |
|---------|------|-----------|-------------|
| T1 | Search style prompts, write `.superdesign/design-system.md` | 3 | `.superdesign/design-system.md` |
| T2 | Create superdesign project + initial draft (app shell) | 5 | Project ID, Draft ID, draft URL |
| T3 | Execute flow pages for remaining screens | 8 | 4 additional page draft URLs |

**Screens to design**:
1. App shell — sidenav (Pricing Tracker module entry) + theme toggle (top right)
2. Pricing Tracker — item list + search bar
3. Create item modal — source repeater with URL/currency/class fields
4. Item detail — sources list + price history charts per source
5. Favorites section

**Design direction**:
- Futuristic purple/violet palette (violet primary, surface-mist background)
- Dark/light theme both designed
- PrimeVue Material component aesthetic — cards, dialogs, data tables
- High contrast ratio (≥ 4.5:1)

---

## Phase 2–6 — Implementation (BLOCKED until user approves design)

Workers will be defined after design approval.

### Planned streams (post-approval):

| Worker | Role | Responsibility |
|--------|------|----------------|
| W1-infra | pt-devops-infra | Docker Compose, MinIO, env files |
| W2-schema | pt-data-schema | Prisma schema + migrations |
| W3-backend | pt-backend-eng | Fastify API — all endpoints |
| W4-scraper | pt-general | Python scraper container |
| W5-frontend | pt-frontend-eng | Nuxt 4 app — all pages/components |

## Interface Contracts (defined upfront)

### API Base URL
`NUXT_PUBLIC_API_URL=http://localhost:4000` (via `.env`)

### REST Endpoints (Fastify)
```
GET    /items                     → { items: Item[], total: number }
POST   /items                     → { item: Item }
GET    /items/:id                 → { item: ItemWithSources }
PATCH  /items/:id                 → { item: Item }
DELETE /items/:id                 → { success: boolean }
GET    /items/:id/history         → { history: SourceHistory[] }
POST   /items/:id/scrape          → { jobId: string, status: string }
GET    /sources                   → paginated
POST   /sources                   → { source: Source }
DELETE /sources/:id               → { success: boolean }
GET    /tags                      → { tags: Tag[] }
POST   /tags                      → { tag: Tag }
GET    /currencies/rates          → { rates: Record<string,number>, base: string, date: string }
POST   /images/upload             → { url: string }
```

### Prisma Models
```
Item        { id, name, imageUrl, isFavorite, createdAt, updatedAt }
Tag         { id, name }
ItemTag     { itemId, tagId }
Source      { id, itemId, url, currency, priceClass, cssRule, fatherClass, isMain, lastScrapedAt }
PriceHistory{ id, sourceId, price, scrapedAt }
```

### Docker service names & ports
```
frontend  → port 3000
api       → port 4000
db        → port 5432 (internal only)
scraper   → no external port
storage   → port 9000 (S3), 9001 (MinIO console)
```
