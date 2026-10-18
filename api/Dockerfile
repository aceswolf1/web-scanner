# Production image (published to GHCR). Local dev uses Dockerfile.dev.
FROM node:22-alpine AS build
# openssl here too, so Prisma fetches engines matching the runtime (openssl 3).
RUN apk add --no-cache openssl && npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Prisma client is generated per-arch here (buildx runs this stage under QEMU for arm64).
RUN pnpm db:generate && pnpm build

FROM node:22-alpine AS runtime
# openssl → Prisma engine; chromium + fonts → puppeteer price scraping.
RUN apk add --no-cache wget openssl chromium nss freetype harfbuzz ca-certificates ttf-freefont
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    CHROMIUM_PATH=/usr/bin/chromium-browser
# Full node_modules: the Prisma CLI (devDependency) is needed at startup for `db push`.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
USER node
EXPOSE 4000
# Sync the schema (refuses destructive changes — no --accept-data-loss), then start.
CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate && node dist/index.js"]
