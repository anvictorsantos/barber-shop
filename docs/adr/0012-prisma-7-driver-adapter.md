# ADR 0012 — Prisma 7 with the node-postgres driver adapter

- Status: accepted
- Date: 2026-11-09

## Context

`npm audit --omit=dev` reported a high advisory through Prisma 6's `deepmerge-ts` dependency. The fix
ships in Prisma 7, a major version that also changes how a client connects.

## Decision

Upgrade `prisma` and `@prisma/client` to 7.10.1 and connect through `@prisma/adapter-pg`
(`PrismaPg`) over the `pg` driver. The `datasource` block keeps only `provider`; migration URLs live
in `prisma.config.ts` (`DIRECT_URL`) and runtime connections come from the adapter
(`DATABASE_URL`).

## Consequences

- Every `PrismaClient` needs the adapter: `lib/db/prisma.ts`, `prisma/seed.ts`, and
  `prisma/create-test-users.ts`.
- Prisma no longer auto-loads `.env`, so the integration-test config loads it explicitly.
- `DIRECT_URL` is still required and still points at the unpooled connection for migrations.
- No query-engine binary is shipped, which shrinks the deploy.
- Prisma 8 is already published as a release candidate; this stays on the 7 line until 8 is stable.

## Alternatives considered

- Stay on Prisma 6 and accept the advisory: rejected, it is fixable with a version bump.
- Use Prisma Accelerate instead of the adapter: rejected, it adds a paid dependency for a
  connection-pooling problem this app does not have.
