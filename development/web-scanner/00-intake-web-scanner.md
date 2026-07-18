# Intake: web-scanner

## Objective

Build a full-stack, Dockerized web scraper application with a modular architecture. The first module is the **Pricing Tracker** — a tool that monitors product prices across multiple sources, stores price history, and presents data with interactive charts.

**Two-phase delivery**:
1. **Design phase**: UI/UX design with superdesign (approval gate before implementation)
2. **Implementation phase**: Full build across all containers

## Assumptions

- New greenfield project — no existing code to extend
- Docker Compose will orchestrate all containers
- Nuxt 4 is the frontend; a separate backend API decoupled from Nuxt
- Backend language/framework not specified → infer from stack context (Node.js/Fastify or Python/FastAPI likely); will confirm in plan
- PrimeVue Material theme with violet primary + surface-mist is the UI foundation
- Superdesign will generate HTML canvas drafts first; implementation follows after user approval
- Currency conversion is display-only (no mutation of stored data)
- The scraper runs on a 8-hour cron cycle; also triggered on startup and manually per-item
- Image storage uses a standalone S3-compatible container (e.g., MinIO)
- `.superdesign/` workspace will be created during design phase

## Open Questions

- [confirm-with-user] What backend language/runtime for the API? (Node.js/Fastify, Python/FastAPI, or other?)
- [confirm-with-user] What is the image storage container? MinIO assumed — confirm or specify alternative
- [confirm-with-user] Is authentication/login required for the web UI?
- [confirm-with-user] Are there any deployment targets beyond local Docker Compose? (e.g., cloud, VPS)

## Known Constraints

- All services must be Docker containers
- Nuxt 4 + Vue 3 + TypeScript + Tailwind + PrimeVue (Material/Violet theme) + Zod on frontend
- PostgreSQL + Prisma for database
- Python scraper container (separate from backend)
- CORS must be configured on all containers that expose HTTP
- Currency API: frankfurter.dev (free, no key required)
- Price CSS selector strategy: class-only → father-class + element → CSS rule (smart fallback)

## Input Source

`initial-requirements/web-scrapper-requirements.md`
