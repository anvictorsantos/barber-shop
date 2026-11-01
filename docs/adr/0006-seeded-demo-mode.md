# ADR 0006 — Demo mode uses a seeded database

- Status: accepted
- Date: 2026-11-01

## Context

The old brief wanted the app to work without a database. The new stack is Prisma + PostgreSQL, and the domain now includes orders with several appointments, payments, stock, loyalty ledgers, and reviews. A mock data layer would duplicate every query and drift from production behavior.

The demo must still show the full Figma product: owner, barber, and customer views with realistic data.

## Decision

Demo mode is a seeded PostgreSQL database plus one-click logins.

- `npm run db:seed` creates shop, services, products, barbers, customers, appointments, orders, payments, reviews, loyalty, and favorites.
- Seed dates are relative to the current day.
- `DEMO_MODE=true` exposes login-as-owner, login-as-barber, and login-as-customer actions.
- No in-memory repository, no mock service layer, no forked query paths.
- Production startup refuses `DEMO_MODE=true`.

## Consequences

- A database is required to demo. This is acceptable because deployment and development both use Postgres.
- Seed data is a maintained artifact and must be re-run after schema changes.
- Demo behavior is identical to production behavior, which makes bugs visible.
- Demo credentials must never be able to reach production data.
- The seed must be deterministic enough for screenshots, but relative enough not to look stale.

## Alternatives considered

- **In-memory mock layer** — no database, but duplicates the data access layer and hides real bugs.
- **SQLite for demo** — lighter, but diverges from Postgres constraints and SQL.
- **No demo mode** — simplest, but loses the showable product the Figma flow implies.
