# Progress Report — W3-backend

**Worker**: worker-backend
**Task**: T6 — Build Fastify REST API (MRSC architecture)
**Date**: 2026-07-15
**Status**: in_progress

---

## Plan
1. ✅ Read schema, package.json, tsconfig, Dockerfile, existing prisma.ts, seed.ts
2. ✅ Create directory structure under `api/src/{schemas,repositories,services,controllers}`
3. ⏳ Create Zod schemas (item, source, tag, currency)
4. ⏳ Create repositories (item, source, tag, priceHistory)
5. ⏳ Create services (item, source, tag, scrape, currency)
6. ⏳ Create controllers (item, source, tag, scrape, currency, image)
7. ⏳ Create MinIO lib + image upload
8. ⏳ Wire entry point `src/index.ts`
9. ⏳ Update Dockerfile CMD
10. ⏳ Smoke-build (`tsc --noEmit`) and report

## Notes
- TS strict, no `any`
- Zod validation on every entry point
- CORS via `CORS_ORIGIN` env var
- 1h in-memory cache for frankfurter
- Multipart image upload → MinIO
- `/internal/scrape-result` writes PriceHistory row
- Dockerfile CMD runs `prisma migrate deploy` then `tsx watch`
