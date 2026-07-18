# Requirements: web-scanner

## Functional Requirements

### Architecture & Shell

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| A1 | Modular application shell with sidenav | Sidenav renders module entries; clicking navigates to that module's route |
| A2 | Dark / light theme toggle | Button switches theme; system preference is detected on first load |
| A3 | Purple/violet futuristic color palette | PrimeVue Material theme uses violet primary + surface-mist; contrast ratio ≥ 4.5:1 |
| A4 | Model-Repository-Service-Controller architecture | Each layer is in a distinct directory; no cross-layer skipping |

### Pricing Tracker — Item Management

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| PT1 | Item list view with search (name, source URL, tags) | Search input filters items in real time |
| PT2 | Tag creation and assignment to items | User can type a new tag or pick an existing one during item creation/edit |
| PT3 | Create item modal: name, image (URL or upload), tags | Modal validates required fields; image uploaded to S3 container |
| PT4 | Source repeater in create modal | User can add N sources; each has: URL, currency (7 options), price class, CSS rule, father class, main-price checkbox |
| PT5 | Only one source can be marked as main price | Selecting main on source N deselects all others |
| PT6 | Warn user when scraper finds multiple elements for given selector | Modal/toast shows count and asks user to be more specific |
| PT7 | Smart selector resolution: class → father+class → CSS rule | Scraper applies logic in that priority order based on what fields are populated |
| PT8 | Item card shows: name, source count, main price | Card renders correctly after creation |
| PT9 | Item detail screen | Shows name, all sources, per-source price history chart, link to source URL, last-scraped timestamp |
| PT10 | Edit item: name only and/or reassign main source | Save persists changes; no other fields editable via edit |
| PT11 | Delete item | Confirms and removes item and all its sources |
| PT12 | Delete individual source | Confirms and removes only that source |
| PT13 | Add source to existing item | Uses same source form as creation; appends to item |
| PT14 | Favorite / unfavorite item | Star toggle persists across sessions |
| PT15 | Favorites section in Pricing Tracker | Shows only favorited items |
| PT16 | Per-source currency conversion dropdown | Dropdown converts displayed price to selected currency; original currency and stored data unchanged |
| PT17 | Manual scrape trigger per item | "Scrape now" button fires scrape job; status updates on completion |

### Pricing Tracker — Scraper

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| SC1 | Scraper runs automatically on startup | First scrape cycle executes within 30 s of container start |
| SC2 | Scraper runs on 8-hour cron schedule | Scheduler triggers every 8 h without drift |
| SC3 | Scraper stores price snapshots per source | Each run creates a price_history row with timestamp and price |
| SC4 | Currency exchange rates fetched from frankfurter.dev on conversion | API call made at conversion time; rates not cached longer than 1 h |

### Backend API

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| BE1 | REST API decoupled from Nuxt | Nuxt calls the API; no direct DB access from Nuxt |
| BE2 | CORS enabled for Nuxt origin | All API responses include correct CORS headers |
| BE3 | CRUD endpoints for items, sources, tags, favorites | Full CRUD; validated with Zod (or equivalent) |
| BE4 | Endpoint to trigger manual scrape for one item | POST /items/:id/scrape returns job ID or status |
| BE5 | Endpoint to fetch price history for an item | GET /items/:id/history; returns per-source time-series data |

### Infrastructure

| ID | Requirement | Acceptance Criterion |
|----|-------------|----------------------|
| IN1 | All services run as Docker containers | `docker compose up` starts all services |
| IN2 | PostgreSQL + Prisma schema | All models defined in Prisma schema; migrations run on startup |
| IN3 | S3-compatible image storage container | MinIO (or equivalent) stores uploaded images; presigned URLs returned to frontend |
| IN4 | Python scraper container | Receives scrape tasks; returns results to backend API |

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF1 | Contrast ratio ≥ 4.5:1 for all text against backgrounds |
| NF2 | TypeScript strict mode on frontend |
| NF3 | Zod validation on all API boundaries (frontend and backend) |
| NF4 | Price history chart must render with 0 data points without crashing |
| NF5 | No secrets hardcoded — all env via Docker Compose env files |

## Out of Scope

- User authentication / login
- Multi-user / multi-tenant
- Notifications / email alerts
- Export to CSV / PDF
- Mobile-native app (web responsive is fine)
- Cloud deployment (Docker Compose local only for now)
