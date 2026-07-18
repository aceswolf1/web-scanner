# Task Assignment: W2-schema

**Worker**: worker-schema
**Role**: pt-data-schema
**Project root**: /Users/cace/Desktop/cloud-copy/projects/web-scanner-04
**Phase**: 2 — Database Schema

---

## Objective

Create the complete Prisma schema, migration setup, and seed script for the web-scanner Pricing Tracker. The Prisma files live inside the `api/` directory (co-located with the Fastify backend that uses them).

---

## Task IDs

- **T5** = your task. Call `TaskUpdate(taskId: "5", status: "in_progress", owner: "worker-schema")` immediately.

---

## Data Models

From the team plan:

```
Item        { id, name, imageUrl, isFavorite, createdAt, updatedAt }
Tag         { id, name, color }
ItemTag     { itemId, tagId }
Source      { id, itemId, url, currency, priceClass, cssRule, fatherClass, isMain, lastScrapedAt }
PriceHistory{ id, sourceId, price, scrapedAt }
```

Currency enum: `USD | EUR | GBP | JPY | CAD | MXN | COP`

---

## Deliverables

### 1. `api/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Currency {
  USD
  EUR
  GBP
  JPY
  CAD
  MXN
  COP
}

model Item {
  id         String    @id @default(cuid())
  name       String
  imageUrl   String?
  isFavorite Boolean   @default(false)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  tags    ItemTag[]
  sources Source[]

  @@map("items")
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  color String    @default("#8B5CF6")
  items ItemTag[]

  @@map("tags")
}

model ItemTag {
  itemId String
  tagId  String

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
  @@map("item_tags")
}

model Source {
  id           String    @id @default(cuid())
  itemId       String
  url          String
  currency     Currency  @default(USD)
  priceClass   String?
  cssRule      String?
  fatherClass  String?
  isMain       Boolean   @default(false)
  currentPrice Float?
  lastScrapedAt DateTime?

  item         Item           @relation(fields: [itemId], references: [id], onDelete: Cascade)
  priceHistory PriceHistory[]

  @@map("sources")
}

model PriceHistory {
  id        String   @id @default(cuid())
  sourceId  String
  price     Float
  scrapedAt DateTime @default(now())

  source Source @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@index([sourceId, scrapedAt])
  @@map("price_history")
}
```

### 2. `api/prisma/seed.ts`

Create a seed file with realistic sample data:

```typescript
import { PrismaClient, Currency } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Tags
  const electronics = await prisma.tag.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', color: '#8B5CF6' },
  })
  const gaming = await prisma.tag.upsert({
    where: { name: 'Gaming' },
    update: {},
    create: { name: 'Gaming', color: '#06B6D4' },
  })
  const gpu = await prisma.tag.upsert({
    where: { name: 'GPU' },
    update: {},
    create: { name: 'GPU', color: '#F59E0B' },
  })

  // Item 1: RTX 4090
  const rtx = await prisma.item.upsert({
    where: { id: 'seed-item-rtx4090' },
    update: {},
    create: {
      id: 'seed-item-rtx4090',
      name: 'NVIDIA RTX 4090 Founders Edition',
      imageUrl: null,
      isFavorite: true,
      tags: {
        create: [
          { tag: { connect: { id: electronics.id } } },
          { tag: { connect: { id: gaming.id } } },
          { tag: { connect: { id: gpu.id } } },
        ],
      },
    },
  })

  const amazonSource = await prisma.source.upsert({
    where: { id: 'seed-src-rtx-amazon' },
    update: {},
    create: {
      id: 'seed-src-rtx-amazon',
      itemId: rtx.id,
      url: 'https://amazon.com/nvidia-rtx-4090',
      currency: Currency.USD,
      priceClass: 'a-price-whole',
      fatherClass: 'a-price',
      isMain: true,
      currentPrice: 1599.99,
      lastScrapedAt: new Date(),
    },
  })

  const neweggSource = await prisma.source.upsert({
    where: { id: 'seed-src-rtx-newegg' },
    update: {},
    create: {
      id: 'seed-src-rtx-newegg',
      itemId: rtx.id,
      url: 'https://newegg.com/nvidia-rtx-4090',
      currency: Currency.USD,
      cssRule: '.price-current strong',
      isMain: false,
      currentPrice: 1649.88,
      lastScrapedAt: new Date(),
    },
  })

  // Seed 30 days of price history for both sources
  const now = Date.now()
  const day = 86_400_000
  for (let i = 29; i >= 0; i--) {
    const scrapedAt = new Date(now - i * day)
    await prisma.priceHistory.createMany({
      data: [
        {
          sourceId: amazonSource.id,
          price: 1599.99 + (Math.random() - 0.5) * 80,
          scrapedAt,
        },
        {
          sourceId: neweggSource.id,
          price: 1649.88 + (Math.random() - 0.5) * 60,
          scrapedAt,
        },
      ],
      skipDuplicates: true,
    })
  }

  console.log('Seed complete ✓')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### 3. `api/prisma/migrations/.gitkeep`

Create an empty `.gitkeep` file so the migrations directory is tracked.

### 4. `api/src/lib/prisma.ts` (Prisma singleton)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 5. Update `api/package.json` — add Prisma scripts and deps

The infra worker created a stub `api/package.json`. Add the Prisma-related entries. Write the COMPLETE updated file:

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
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "fastify": "^4.28.1",
    "@fastify/cors": "^9.0.1",
    "@fastify/multipart": "^8.3.0",
    "zod": "^3.23.8",
    "minio": "^8.0.1",
    "axios": "^1.7.7"
  },
  "devDependencies": {
    "prisma": "^5.22.0",
    "tsx": "^4.19.1",
    "typescript": "^5.6.3",
    "@types/node": "^22.7.5"
  }
}
```

### 6. `api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Acceptance Criteria

- [ ] `api/prisma/schema.prisma` exists with all 5 models + Currency enum
- [ ] All models have correct relations with Cascade deletes
- [ ] `@@index` on `price_history(sourceId, scrapedAt)` for query performance
- [ ] `api/prisma/seed.ts` creates ≥1 item with ≥2 sources and 30 days of history
- [ ] `api/src/lib/prisma.ts` exports singleton Prisma client
- [ ] `api/package.json` includes `@prisma/client`, `prisma`, all Fastify deps, and `zod`
- [ ] `api/tsconfig.json` with strict mode enabled

---

## Reporting

1. Write `development/web-scanner/tasks/W2-schema/progress-report.md`
2. Write `development/web-scanner/tasks/W2-schema/completion-report.md`
3. `TaskUpdate(taskId: "5", status: "completed")`
4. Send: `COMPLETE: Schema done. Prisma models + seed + Prisma singleton + api/package.json ready.`
