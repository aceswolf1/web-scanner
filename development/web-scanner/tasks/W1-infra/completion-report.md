# W1-infra — Completion Report

**Worker**: worker-infra (pt-devops-infra)
**Task**: T4 — Docker Compose + env + Dockerfiles
**Status**: ✅ COMPLETED
**Date**: 2026-07-15

---

## Summary

Complete Docker Compose skeleton for the web-scanner project delivered. All 6 services (frontend, api, scraper, db, storage, storage-init) are wired into a single `web-scanner` bridge network with healthchecks and proper dependency ordering. Other workers (W2-schema, W3-backend, W4-scraper, W5-frontend) can now implement their service code and run `docker compose up` to bootstrap the full stack.

---

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `docker-compose.yml` | All 6 services + volumes + network |
| 2 | `.env.example` | Env var template |
| 3 | `.env` | Local dev env (same as .env.example) |
| 4 | `frontend/Dockerfile` | Node 22 Alpine + pnpm + Nuxt dev server |
| 5 | `frontend/package.json` | Stub for Nuxt 4 build |
| 6 | `api/Dockerfile` | Node 22 Alpine + wget + pnpm + Fastify dev |
| 7 | `api/package.json` | Stub for Fastify/Prisma build |
| 8 | `scraper/Dockerfile` | Python 3.12 slim + pip |
| 9 | `scraper/requirements.txt` | Pinned: requests, bs4, lxml, apscheduler, httpx |

## Files Modified

| File | Change |
|------|--------|
| `.gitignore` | Added `.env`, `postgres_data/`, `minio_data/`, `__pycache__/`, `*.pyc`, `.nuxt/`, `.output/` |

## Reports

- `development/web-scanner/tasks/W1-infra/progress-report.md` — per-file progress log

---

## Architecture

### Service Map

```
┌────────────┐   HTTP :3000    ┌────────────┐
│  Frontend  │ ──────────────▶ │     API    │ :4000
│  (Nuxt 4)  │                 │  (Fastify) │
└────────────┘                 └─────┬──────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  ▼                  ▼                  ▼
            ┌──────────┐      ┌──────────┐      ┌──────────┐
            │   DB     │      │ Storage  │      │ Scraper  │
            │ Postgres │      │  MinIO   │      │  Python  │
            │   :5432  │      │ :9000/01 │      │  (cron)  │
            └──────────┘      └─────┬────┘      └──────────┘
                                    │
                              ┌─────▼──────┐
                              │ storage-   │
                              │ init (mc)  │
                              └────────────┘
```

### Network

Single bridge network `web-scanner` shared by all services — service-to-service DNS via service name (e.g., `db`, `api`, `storage`).

### Volumes

| Volume | Purpose |
|--------|---------|
| `postgres_data` | Persistent DB storage |
| `minio_data` | Persistent S3-compatible storage |
| `frontend_nm` | Node modules (avoids host mount collisions) |
| `frontend_nuxt` | Nuxt build cache |
| `api_nm` | API node modules |

### Dependency Order

1. `db` + `storage` start in parallel
2. `storage-init` runs once `storage` is healthy
3. `api` starts once `db` AND `storage` are healthy
4. `frontend` + `scraper` start once `api` is healthy

### Healthchecks

| Service | Check |
|---------|-------|
| `db` | `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB` |
| `storage` | `mc ready local` |
| `api` | `wget -qO- http://localhost:4000/health` |

---

## Environment Variables (used by services)

| Var | Used by | Default |
|-----|---------|---------|
| `DATABASE_URL` | api | postgresql://webscanner:webscanner@db:5432/webscanner |
| `POSTGRES_DB/USER/PASSWORD` | db | webscanner/webscanner/webscanner |
| `MINIO_ENDPOINT` | api | storage |
| `MINIO_PORT` | api | 9000 |
| `MINIO_ACCESS_KEY` | api | minioadmin |
| `MINIO_SECRET_KEY` | api | minioadmin123 |
| `MINIO_BUCKET` | api + storage-init | web-scanner-images |
| `MINIO_ROOT_USER` | storage + storage-init | minioadmin |
| `MINIO_ROOT_PASSWORD` | storage + storage-init | minioadmin123 |
| `CORS_ORIGIN` | api | http://localhost:3000 |
| `PORT` | api | 4000 |
| `NUXT_PUBLIC_API_URL` | frontend | http://localhost:4000 |
| `NUXT_PUBLIC_STORAGE_URL` | frontend | http://localhost:9000 |
| `API_INTERNAL_URL` | scraper | http://api:4000 |
| `SCRAPE_INTERVAL_HOURS` | scraper | 8 |

---

## Verification Commands

```bash
# Validate compose syntax
cd /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
docker compose config

# Build images (will succeed even with stub package.json files)
docker compose build

# Bring up the full stack
docker compose up -d

# Check service health
docker compose ps

# Tail logs
docker compose logs -f
```

---

## Acceptance Criteria — All Met

- [x] `docker-compose.yml` at project root with all 6 services
- [x] `.env.example` and `.env` with all required variables
- [x] `frontend/Dockerfile`, `api/Dockerfile`, `scraper/Dockerfile` exist
- [x] `scraper/requirements.txt` exists
- [x] `frontend/package.json` and `api/package.json` stubs exist
- [x] `.gitignore` includes `.env` and `node_modules/`
- [x] All services reference network `web-scanner`
- [x] db and storage services have health checks
- [x] api depends_on db + storage with `condition: service_healthy`
- [x] storage-init runs after storage is healthy and creates the bucket

---

## Notes for Downstream Workers

- **W2-schema (Prisma)**: DATABASE_URL is already wired. Run `pnpm prisma migrate deploy` inside the `api` container.
- **W3-backend (Fastify)**: Expose `/health` endpoint for the API container healthcheck to pass.
- **W4-scraper (Python)**: Use `API_INTERNAL_URL=http://api:4000` for inter-service calls (Docker DNS).
- **W5-frontend (Nuxt)**: Read `NUXT_PUBLIC_API_URL` and `NUXT_PUBLIC_STORAGE_URL` via Nuxt runtime config; do NOT hardcode localhost.

---

## Local Dev Bootstrap

```bash
cp .env.example .env       # already done
docker compose up -d        # start everything
docker compose logs -f api # watch API boot
```