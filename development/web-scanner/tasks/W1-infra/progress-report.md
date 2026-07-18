# W1-infra — Progress Report

**Worker**: worker-infra (pt-devops-infra)
**Task**: T4 — Docker Compose + env + Dockerfiles
**Status**: In Progress

---

## Files Created

### 1. `docker-compose.yml` (project root)
- 6 services defined: frontend, api, scraper, db, storage, storage-init
- Single bridge network `web-scanner` shared across all services
- Named volumes: `postgres_data`, `minio_data`, `frontend_nm`, `frontend_nuxt`, `api_nm`
- Healthchecks on db (pg_isready), storage (mc ready local), api (wget /health)
- Depends_on with `condition: service_healthy` chained: storage → storage-init, db + storage → api, api → frontend & scraper
- storage-init runs once after storage is healthy: creates bucket + sets anonymous download policy

### 2. `.env.example` (project root)
- Database block: DATABASE_URL + POSTGRES_DB/USER/PASSWORD
- API block: CORS_ORIGIN, PORT
- MinIO block: ROOT creds + endpoint/port/access/secret/bucket
- Frontend block: NUXT_PUBLIC_API_URL, NUXT_PUBLIC_STORAGE_URL

### 3. `.env` (project root)
- Identical to `.env.example` with local dev defaults — safe for commit-blind local bootstrap

### 4. `frontend/Dockerfile`
- `node:22-alpine` base, corepack enabled for pnpm
- pnpm install with frozen-lockfile fallback
- CMD runs `pnpm run dev --host 0.0.0.0` so Nuxt binds all interfaces

### 5. `api/Dockerfile`
- `node:22-alpine` + wget (for healthcheck), corepack enabled
- pnpm install with fallback
- CMD runs `pnpm run dev` (tsx watch on src/index.ts per stub package.json)

### 6. `scraper/Dockerfile`
- `python:3.12-slim` base
- Installs requirements.txt then copies source
- CMD runs `python main.py`

### 7. `scraper/requirements.txt`
- requests, beautifulsoup4, lxml, apscheduler, httpx — pinned versions for reproducibility

### 8. `frontend/package.json` (stub)
- type: module, scripts: dev/build/preview (Nuxt 4)

### 9. `api/package.json` (stub)
- type: module, scripts: dev (tsx watch), build (tsc), start, db:migrate, db:generate

### 10. `.gitignore` updates
- Appended: `.env`, `postgres_data/`, `minio_data/`, `__pycache__/`, `*.pyc`, `.nuxt/`, `.output/`
- Existing entries preserved

---

## Verification

- All file paths match task spec exactly
- All 6 services reference network `web-scanner`
- Healthchecks present on db + storage + api
- api depends_on db + storage with `condition: service_healthy`
- storage-init depends_on storage with `condition: service_healthy`

## Notes

- No production environment targeted — all values are local-dev defaults
- MinIO creds default to minioadmin/minioadmin123 (acceptable for local dev only)
- Stub package.json files will be expanded by frontend and backend workers as they implement features