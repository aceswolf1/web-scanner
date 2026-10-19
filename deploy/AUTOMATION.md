# Automated deploy: GitHub → GHCR → NAS

This wires the repo to your TrueNAS so a **release tag** rebuilds the images and
the NAS **auto-updates itself** — no SSH, no build on the NAS, nothing exposed to
the internet.

```
git tag v0.1.0 && git push origin v0.1.0
        │
        ▼
GitHub Actions (.github/workflows/publish.yml)
   check (API typecheck + scraper compile)
   build multi-arch (amd64+arm64) → push to GHCR
   tags: 0.1.0, 0.1, latest
        │
        ▼  (Watchtower polls GHCR every 5 min)
NAS Watchtower ──▶ new :latest digest? ──▶ pull + recreate api, scraper, frontend
```

Images (all under `ghcr.io/aceswolf1/`):

| Service    | Image                  | Auto-updated | State                                    |
|------------|------------------------|--------------|------------------------------------------|
| `frontend` | `web-scanner-frontend` | yes          | stateless — the only published port      |
| `api`      | `web-scanner-api`      | yes          | stateless                                |
| `scraper`  | `web-scanner-scraper`  | yes          | stateless                                |
| `db`       | `postgres:16-alpine`   | **no**       | `/mnt/storage/web-scanner/postgres`      |
| `storage`  | `pgsty/minio` (pinned) | **no**       | `/mnt/storage/web-scanner/minio`         |

### How the browser reaches the backend

Only the frontend port is published. The Nuxt server proxies:

- `/api/*` → `http://api:4000/*` (scraper-only `/internal/*` is blocked → 404)
- `/storage/<bucket>/<key>` → MinIO, **GET/HEAD only** (no listings, no uploads)

So the API, Postgres and MinIO are never reachable from the LAN directly, and
there's no CORS to configure. New uploads are stored with relative
`/storage/...` URLs (`MINIO_PUBLIC_URL=/storage`).

---

## Part 1 — CI (one-time)

`.github/workflows/publish.yml` needs **no secrets**; it uses the built-in
`GITHUB_TOKEN`.

1. Push the repo to GitHub:
   ```bash
   git remote add origin https://github.com/aceswolf1/web-scanner.git
   git push -u origin main
   ```
2. **Settings → Actions → General → Workflow permissions** → **"Read and write
   permissions"** (lets Actions push to GHCR).
3. If you ever pushed `web-scanner-*` images manually, read the gotcha below
   before your first run.

### Gotcha: `denied: permission_denied: write_package` on the first run

```
failed to push ghcr.io/aceswolf1/web-scanner-api:<tag>: denied:
permission_denied: write_package
```

Cause: a **pre-existing GHCR package not linked to this repo** (created by a
manual `docker push`). Its Actions token has no write role even though the
workflow requests `packages: write`. Fix once, per affected package:

1. Open `https://github.com/users/aceswolf1/packages/container/<package>/settings`
   (`web-scanner-api`, `web-scanner-frontend`, `web-scanner-scraper`).
2. **Manage Actions access → Add Repository →** `web-scanner` **→ Role: Write**.
3. **Actions → the run → Re-run failed jobs.** No new tag needed.

Packages *created by* an Actions run are linked automatically, so a clean first
publish doesn't hit this.

### Make the packages public (recommended)

New GHCR packages are **private**. After the first successful run, for each of the
three packages: **Package settings → Change visibility → Public**. Then neither
TrueNAS nor Watchtower needs registry credentials. (Private instead? See
"Private GHCR images" below.)

### Cutting a release

```bash
git tag v0.1.0
git push origin v0.1.0
```

When the **Actions** run is green, each image has `:0.1.0`, `:0.1` and `:latest`.

> Watchtower tracks the **moving `:latest`** tag — that's why every release also
> moves `:latest`, even though you trigger with a version tag.

The arm64 leg builds under QEMU (Chromium + Prisma for the API), so the first run
takes a while; later runs reuse the per-service `gha` cache.

---

## Part 2 — Deploy the stack on TrueNAS (one-time)

1. Create the datasets (or plain directories) for state:
   `/mnt/storage/web-scanner/postgres` and `/mnt/storage/web-scanner/minio`.
   Adjust the paths in the YAML if your pool isn't named `storage`.
2. **Apps → Discover Apps → Custom App → Install via YAML**, name it
   `web-scrapper`, and paste [`docker-compose.registry.yml`](../docker-compose.registry.yml).
   (Paste the **registry** file, not the dev `docker-compose.yml`. The right one
   has no `build:` lines and no `storage-init`.)
3. **Fill in secrets directly in the pasted YAML** (see the gotcha below):
   - `${POSTGRES_PASSWORD:?...}` (both occurrences: `db` and `api`'s `DATABASE_URL`)
     — use a **URL-safe** password (letters/digits/`-`/`_`), it is embedded in a URL.
   - `${MINIO_ROOT_USER:?...}` / `${MINIO_ROOT_PASSWORD:?...}` (in `storage` and
     `api`). MinIO requires a password of **8+ characters**.
   - Optional: eBay / Mercado Libre keys under `api`.
4. Port: the app listens on **`3002`** by default (`3001` is PixelPaladin). Change
   the left side of `"${APP_PORT:-3002}:3000"` if needed.
5. Deploy, then open `http://<nas-ip>:3002`.

TrueNAS names containers after the **app**, not the repo: `ix-web-scrapper-<service>-1`.

| Service    | Container                     |
|------------|-------------------------------|
| `frontend` | `ix-web-scrapper-frontend-1`  |
| `api`      | `ix-web-scrapper-api-1`       |
| `scraper`  | `ix-web-scrapper-scraper-1`   |
| `db`       | `ix-web-scrapper-db-1`        |
| `storage`  | `ix-web-scrapper-storage-1`   |

On first start the API creates the schema (`prisma db push`, which refuses
destructive changes) and the image bucket with its public-read policy. No
separate init container is needed.

### Gotcha: TrueNAS Custom Apps don't read `.env`

The `${VAR:?...}` placeholders resolve from a `.env` with plain `docker compose`,
but a TrueNAS Custom App has none. Left as-is, the deploy **fails on purpose**
(`required variable POSTGRES_PASSWORD is missing a value`) instead of starting
with blank passwords. Replace them with real values **in the TrueNAS YAML only**.
Never commit secrets to `docker-compose.registry.yml`.

---

## Part 3 — Watchtower on the NAS (one-time)

**Already running Watchtower for PixelPaladin with `WATCHTOWER_LABEL_ENABLE=true`?
Skip this part.** It watches every labelled container on the host, including
`api`, `scraper` and `frontend` here.

Otherwise:

1. **Apps → Discover Apps → Custom App → Install via YAML**, paste
   [`deploy/watchtower.compose.yml`](./watchtower.compose.yml), deploy.
2. Within one poll (5 min), its logs should end with
   `Session done ... Scanned=3 ...` (more if other apps are labelled).

From now on: `git tag vX.Y.Z && git push origin vX.Y.Z`, and a few minutes later
the NAS runs the new build. `db` and `storage` are never touched.

---

## Private GHCR images (only if you keep packages private)

1. Create a GitHub **PAT (classic)** with only `read:packages`.
2. On the NAS: `sudo docker login ghcr.io -u aceswolf1` (paste the PAT) so the
   initial Custom App deploy can pull.
3. Create `/mnt/storage/web-scanner/watchtower-config.json`:
   ```json
   { "auths": { "ghcr.io": { "auth": "BASE64_OF_aceswolf1:PAT" } } }
   ```
   (`printf 'aceswolf1:<PAT>' | base64`), and uncomment the `/config.json` volume
   line in `watchtower.compose.yml`.

---

## Update model

`:latest` pinning makes updates **digest-based**, not version-picking.

- **Auto (default):** Watchtower drives. Ignore the TrueNAS "update available"
  badge; it clears after the next poll.
- **Manual instead:** if you'd rather click Update in TrueNAS, stop Watchtower so
  the two don't both act.
- **Version-pinned:** set the images to `:X.Y.Z` (e.g. via
  `${IMAGE_TAG:-latest}` → `0.1.0`) and remove the watchtower labels.

## Rolling back

Set `api` / `scraper` / `frontend` to a previous version tag (e.g. `:0.1.0`) in the
TrueNAS YAML and remove their watchtower labels, or re-tag a previous release.
Schema changes are applied with `prisma db push` (non-destructive only), so an
older API generally runs against a newer schema with only additive columns.

## Local development

Unchanged: `docker compose up` uses `docker-compose.yml`, which builds from each
service's `Dockerfile.dev` (hot reload, bind mounts, published ports). The
production `Dockerfile`s are only used by CI and for local production testing:

```bash
docker build -t ghcr.io/aceswolf1/web-scanner-api:local ./api   # same for frontend, scraper
IMAGE_TAG=local POSTGRES_PASSWORD=... MINIO_ROOT_USER=... MINIO_ROOT_PASSWORD=... \
  docker compose -p ws-smoke -f docker-compose.registry.yml up -d
```

(Point the `/mnt/storage/...` volume paths somewhere writable when doing this on
a laptop.)

---

## Gotchas quick-reference

| Symptom | Cause | Fix |
|---|---|---|
| `denied: permission_denied: write_package` | Pre-existing package not linked to repo | Manage Actions access → Add Repository → Write; re-run |
| `exec format error` on NAS | Single-arch image | Workflow builds amd64+arm64; don't push manual single-arch images |
| Watchtower `Scanned=0`, never updates | App YAML pasted without the `labels:` blocks | Re-paste current `docker-compose.registry.yml`, keep labels |
| Deploy fails: `required variable ... is missing a value` | `${VAR:?}` left in TrueNAS YAML | Replace with real values in the TrueNAS YAML |
| API restarts, `Can't write to .../@prisma/engines` | Prisma engine/OpenSSL mismatch in image | Build stage must `apk add openssl` (already done); rebuild |
| API exits on `db push` after a release | Schema change would lose data | Make the change additive, or migrate manually |
| Images 404 after moving hosts | Old rows hold absolute `http://localhost:9000/...` URLs | Only affects data imported from dev; re-upload or update URLs |
| `pull access denied for minio/minio` (or `minio/mc`) | MinIO stopped publishing official images | Use `pgsty/minio` (already in the compose files); bump its pinned tag deliberately |
| Private image pull fails on NAS | No registry creds | Make packages public, or `docker login ghcr.io` + config.json |
| API log: `P1000: Authentication failed ... for webscanner` | Password in `DATABASE_URL` ≠ `POSTGRES_PASSWORD`, **or** Postgres initialized its dataset earlier with another password (it only reads `POSTGRES_PASSWORD` on first init) | Make them match; if they already match, stop the app, empty the `postgres` dataset (`sudo find /mnt/storage/web-scanner/postgres -mindepth 1 -delete`), start again. Only do this while there's no data to keep |
| `docker logs` → `No such container` after a failed deploy | TrueNAS deletes containers when `up` fails | Capture logs live (see the tip below) |

### Tip: Docker commands on TrueNAS

The admin user isn't in the `docker` group, so prefix every command with `sudo`
(including inside `$(...)`), e.g.:

```bash
sudo docker ps -a --filter name=ix-web-scrapper --format '{{.Names}}\t{{.Status}}'
sudo docker logs ix-web-scrapper-api-1 --tail 50
sudo docker logs ix-web-scrapper-scraper-1 --tail 20
sudo docker inspect -f '{{.Name}} label={{index .Config.Labels "com.centurylinklabs.watchtower.enable"}}' \
  ix-web-scrapper-api-1 ix-web-scrapper-scraper-1 ix-web-scrapper-frontend-1
```

### Tip: logs from a deploy that fails

When `up` fails (`dependency failed to start: container ... is unhealthy`),
TrueNAS removes the containers, and their logs go with them. The UI traceback
is generic; the compose output is in `sudo tail -n 40 /var/log/app_lifecycle.log`.
To see *why* a container failed, start this watcher **before** clicking Start
in the UI:

```bash
until sudo docker ps -aq -f name=ix-web-scrapper-api-1 | grep -q .; do sleep 1; done; \
  sudo docker logs -f ix-web-scrapper-api-1 2>&1 | tee /tmp/api.log
```

The rendered compose that TrueNAS actually deployed (handy for checking pasted
values) is at:

```bash
sudo find /mnt/.ix-apps/app_configs/web-scrapper -name 'docker-compose.yaml'
```
