# Decision: Backend Runtime + Image Storage

**Date**: 2026-07-15
**Status**: Approved by user

## Decision

- **Backend API**: Node.js + Fastify (TypeScript-native, pairs cleanly with Prisma)
- **Image storage**: MinIO (S3-compatible, self-hosted Docker container)

## Rationale

User confirmed both assumptions from the feature plan. No alternatives to evaluate.

## Impact

- `api/` directory: Fastify project with TypeScript + Prisma client + Zod
- `docker-compose.yml`: MinIO service with CORS policy configured via `mc` entrypoint
- Presigned URL flow: Fastify generates presigned URLs; frontend uploads directly to MinIO
