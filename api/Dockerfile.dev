FROM node:22-alpine
RUN apk add --no-cache wget openssl chromium nss freetype harfbuzz ca-certificates ttf-freefont
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 4000
# Generate the Prisma client, run pending migrations, then start the dev server.
CMD ["sh", "-c", "pnpm db:generate && pnpm db:push && pnpm dev"]
