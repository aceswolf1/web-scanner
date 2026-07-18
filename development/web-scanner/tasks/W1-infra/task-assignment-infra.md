# Task Assignment: W1-infra

**Worker**: worker-infra
**Role**: pt-devops-infra
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: 2 — Infrastructure

---

## Objective

Create the complete Docker Compose infrastructure for the web-scanner project. You are setting up the skeleton that all other services will run inside. Other workers (backend, frontend, scraper) will fill in their application code — you create the containers, wiring, and environment config.

---

## Task IDs

- **T4** = your task. Call `TaskUpdate(taskId: "4", status: "in_progress", owner: "worker-infra")` immediately.

---

## Tech Stack

| Service | Image / Runtime | Port |
|---------|----------------|------|
| frontend | Node 22 Alpine + Nuxt 4 | 3000 |
| api | Node 22 Alpine + Fastify | 4000 |
| scraper | Python 3.12 slim | (internal only) |
| db | postgres:16-alpine | 5432 (internal) |
| storage | minio/minio:latest | 9000 (S3), 9001 (console) |
| storage-init | minio/mc:latest | (one-shot init container) |

---

## Deliverables

Create ALL of the following files:

### 1. `docker-compose.yml` (project root)

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - frontend_nm:/app/node_modules
      - frontend_nuxt:/app/.nuxt
    environment:
      - NUXT_PUBLIC_API_URL=${NUXT_PUBLIC_API_URL}
      - NUXT_PUBLIC_STORAGE_URL=${NUXT_PUBLIC_STORAGE_URL}
    depends_on:
      api:
        condition: service_healthy
    networks:
      - web-scanner
    restart: unless-stopped

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    volumes:
      - ./api:/app
      - api_nm:/app/node_modules
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_PORT=${MINIO_PORT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
      - MINIO_USE_SSL=false
      - CORS_ORIGIN=${CORS_ORIGIN}
      - PORT=4000
      - NODE_ENV=development
    depends_on:
      db:
        condition: service_healthy
      storage:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s
    networks:
      - web-scanner
    restart: unless-stopped

  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
    environment:
      - API_INTERNAL_URL=http://api:4000
      - SCRAPE_INTERVAL_HOURS=8
      - NODE_ENV=development
    depends_on:
      api:
        condition: service_healthy
    networks:
      - web-scanner
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - web-scanner
    restart: unless-stopped

  storage:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - web-scanner
    restart: unless-stopped

  storage-init:
    image: minio/mc:latest
    depends_on:
      storage:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set minio http://storage:9000 $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD &&
      mc mb --ignore-existing minio/$$MINIO_BUCKET &&
      mc anonymous set download minio/$$MINIO_BUCKET &&
      echo 'MinIO bucket ready' &&
      exit 0
      "
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
      - MINIO_BUCKET=${MINIO_BUCKET}
    networks:
      - web-scanner

volumes:
  postgres_data:
  minio_data:
  frontend_nm:
  frontend_nuxt:
  api_nm:

networks:
  web-scanner:
    driver: bridge
```

### 2. `.env.example` (project root)

```dotenv
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://webscanner:webscanner@db:5432/webscanner
POSTGRES_DB=webscanner
POSTGRES_USER=webscanner
POSTGRES_PASSWORD=webscanner

# ── API ───────────────────────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000
PORT=4000

# ── MinIO ─────────────────────────────────────────────────────────────────────
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ENDPOINT=storage
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=web-scanner-images

# ── Frontend ──────────────────────────────────────────────────────────────────
NUXT_PUBLIC_API_URL=http://localhost:4000
NUXT_PUBLIC_STORAGE_URL=http://localhost:9000
```

### 3. `.env` (project root — copy of .env.example with local dev values filled in)

Copy `.env.example` content exactly — it already has sensible local dev defaults.

### 4. `frontend/Dockerfile`

```dockerfile
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install
EXPOSE 3000
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
```

### 5. `api/Dockerfile`

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache wget
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install
EXPOSE 4000
CMD ["pnpm", "run", "dev"]
```

### 6. `scraper/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### 7. `scraper/requirements.txt` (stub — scraper worker will expand)

```
requests==2.32.3
beautifulsoup4==4.12.3
lxml==5.2.2
apscheduler==3.10.4
httpx==0.27.0
```

### 8. `frontend/package.json` (stub for Docker build)

```json
{
  "name": "web-scanner-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview"
  }
}
```

### 9. `api/package.json` (stub for Docker build)

```json
{
  "name": "web-scanner-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  }
}
```

### 10. `.gitignore` additions

Append these lines to the existing `.gitignore` (create if missing):

```
# Environment
.env

# Docker volumes (local dev)
postgres_data/
minio_data/

# Dependencies
node_modules/
__pycache__/
*.pyc

# Build outputs
dist/
.nuxt/
.output/
```

---

## Acceptance Criteria

- [ ] `docker-compose.yml` exists at project root with all 6 services defined
- [ ] `.env.example` and `.env` exist with all required variables
- [ ] `frontend/Dockerfile`, `api/Dockerfile`, `scraper/Dockerfile` exist
- [ ] `scraper/requirements.txt` exists
- [ ] `frontend/package.json` and `api/package.json` stubs exist
- [ ] `.gitignore` includes `.env` and `node_modules/`
- [ ] All services in docker-compose reference the correct network `web-scanner`
- [ ] db and storage services have health checks
- [ ] api depends_on db + storage with condition: service_healthy
- [ ] storage-init runs after storage is healthy and creates the bucket

---

## Reporting

1. Write `development/web-scanner/tasks/W1-infra/progress-report.md` after each file created
2. Write `development/web-scanner/tasks/W1-infra/completion-report.md` listing all files created
3. `TaskUpdate(taskId: "4", status: "completed")`
4. Send: `COMPLETE: Infrastructure done. docker-compose.yml + env + Dockerfiles created.`
