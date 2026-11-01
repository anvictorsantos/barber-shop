# ADR 0001 — Next.js, Prisma, and PostgreSQL

- Status: accepted
- Date: 2026-11-01

## Context

The old scaffold was MEVN (Vue 3 + Express + Mongoose) and was deleted. The product now includes a multi-step booking flow, a cart with services and products, payments with webhooks, PDF receipts, scheduled reminders, role-scoped dashboards, and loyalty. The Figma screens are component-dense and stateful.

MongoDB cannot express the slot-overlap invariant cleanly. Double-booking must be impossible under parallel checkouts, not merely rare.

## Decision

Build one Next.js App Router application in TypeScript, with Prisma on PostgreSQL.

- Server Components for reads; Server Actions and route handlers for writes.
- Payment webhooks and cron live in route handlers.
- PostgreSQL exclusion constraints enforce non-overlapping active appointments.
- Prisma migrations include raw SQL for constraints Prisma cannot express.
- Deploy target: Render web service + Neon Postgres. Render Cron handles reminders and hold expiry.

## Consequences

- The entire UI becomes React. The old Vue code is not reused.
- Prisma owns the schema and migrations; no hand-written query layer.
- The database enforces the hardest booking invariant, so application bugs cannot double-book.
- Cron and webhooks require a public deployment or a tunnel; local-only is no longer enough for full payment testing.
- Render runs the web service and cron jobs; the database stays external on Neon, so the host can change without a migration.
- The stack is TypeScript end to end, which simplifies shared validation and domain types.

## Alternatives considered

- **Nuxt 3 + Postgres** — keeps Vue, but the team’s Figma-to-React path and ecosystem for payments/cron are stronger in Next.
- **Keep MEVN with TypeScript** — two processes to deploy and no relational exclusion constraint.
- **Laravel + Inertia** — strong fit for a single shop, but adds a second language and a less direct match to the React component plan.
