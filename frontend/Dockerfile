# Production image (published to GHCR). Local dev uses Dockerfile.dev.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
# Runtime overrides use NUXT_* names (nuxt.config's process.env is read at build time):
#   NUXT_PUBLIC_API_URL, NUXT_PUBLIC_STORAGE_URL, NUXT_API_INTERNAL_URL, NUXT_STORAGE_INTERNAL_URL
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NUXT_PUBLIC_API_URL=/api \
    NUXT_PUBLIC_STORAGE_URL=/storage
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
