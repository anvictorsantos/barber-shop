# ADR 0010 — Rate-limit counters live in Postgres

- Status: accepted
- Date: 2026-11-08

## Context

Rate-limit buckets were a module-level `Map`: counters reset on every deploy and are not shared
across instances. The assessment relied on rotating a header to bypass them, but the store is also
the place where per-account lockout and OTP caps must live, and those need to survive restarts.

The app already uses Postgres through Prisma/Neon. A Redis service would add a dependency, a second
credential, and a second failure mode for a barbershop-sized workload.

## Decision

Counters live in a `rate_limits` table with `key`, `count`, and `reset_at`. Each check is one atomic
upsert. The in-memory implementation stays behind a test-only entry point so unit tests do not need
a database.

## Consequences

- Lockout state survives deploys and is shared by every instance.
- Every limited request performs one indexed write. The hottest path is availability at 120
  requests/minute; that is well within the current database headroom.
- Expired rows are pruned opportunistically by the same upsert path.
- Tests that exercise limiter logic use the in-memory implementation; integration tests use the
  table.

## Alternatives considered

- **Redis/Upstash** — faster and purpose-built, but adds a service and a dependency for this volume.
- **In-memory plus per-account counters** — still resets on deploy and cannot be shared.
