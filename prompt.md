# Barbearia do Luiz

You are building a single-shop booking and commerce app for a neighborhood barbershop in Belo Horizonte. PT-BR copy, BRL, timezone `America/Sao_Paulo`, dark UI. The engine is deterministic: **no AI, no LLM calls, no model dependency, no AI SDK**. Do not add one.

## What the product does

- **Customer** — browse services and products, pick a barber, date, and time, build a cart with one or more services plus optional products, pay online or at the chair, then track appointments, stamps, reviews, favorites, and repeat bookings.
- **Owner (Luiz)** — everything: agenda, clients, catalog, stock, finance, team, hours, settings. Luiz also cuts hair and is bookable.
- **Barbers (Hinner, Carlos)** — only their own dashboard, agenda, clients, appointments, time blocks, and manual bookings.

One appointment = one service + one barber + one time. An order = zero or more appointments + zero or more product lines + one payment context. Products are pickup-only and always prepaid online.

## Read these first

| File | It decides |
| --- | --- |
| `GLOSSARY.md` | Canonical terms. Use these words in code and UI; do not invent synonyms. |
| `docs/DATA-MODEL.md` | Prisma schema, enums, SQL constraints, slot algorithm, lifecycle rules. This is the contract. |
| `docs/PRD.md` | Roles, screens, routes, flows, acceptance criteria. |
| `docs/BUILD-PLAN.md` | Phases, repo shape, testing strategy, deployment runbook. |
| `docs/DESIGN-GUIDELINES.md` | Tokens, type scale, components, motion, accessibility. |
| `docs/LANDING-PAGE-SPEC.md` | The `/` page, section by section, plus SEO and CTA behavior. |
| `docs/MVP-SCOPE.md` | MoSCoW. Do not build Should/Could items until every Must works. |
| `docs/adr/*` | Why the stack, auth, orders, payments, notifications, demo, roles are what they are. |
| `README.md` | Tooling actually wired in this repo today. |

When a doc disagrees with the repo, the repo config wins for tooling and the doc gets corrected in the same change. Known drift:

| Docs say | Repo does | Follow |
| --- | --- | --- |
| `pnpm` (BUILD-PLAN) | npm everywhere (`package.json`, Husky, Playwright, `render.yaml`) | npm |
| Vercel + Vercel Cron (PRD, ADR 0001) | `render.yaml` web service on Render + external Neon Postgres | Render; update the ADR when deployment is settled |
| `tailwind.config.ts` (DESIGN-GUIDELINES) | `tailwind.config.js`, loaded via `@config` in `app/globals.css` | `tailwind.config.js` |
| `docker-compose.yml` (BUILD-PLAN tree) | absent | add it, or document an external Postgres |
| `db:seed` script (BUILD-PLAN) | absent from `package.json` | add it with the seed |
| `tests/integration/` | Vitest only includes `tests/unit/**` | extend the include when integration tests land |

## Current state

Foundation only. The product is not built.

Already in place: Next 16 App Router shell, strict TypeScript, Tailwind 4 tokens mapped to utilities, ESLint 9 flat config, Prettier, Husky + lint-staged, GTM behind consent, Sentry with PII scrubbing and tunnel, Playwright, Vitest, `/api/health`, a placeholder landing and `/privacidade`, and a Render blueprint.

Missing: Prisma models and migrations (the schema currently has only `generator` and `datasource`), raw SQL constraints, seed, env validation, auth, sessions, role scoping, layout shells, UI primitives, and every feature phase.

Work one BUILD-PLAN phase at a time. Each phase ends with a runnable app and a short acceptance demo.

## Stack

Next.js 16 App Router + React 19 + TypeScript strict. Tailwind 4 via `@tailwindcss/postcss`. Prisma 6 on PostgreSQL 16. Zod 4 for validation. Custom sessions with `@node-rs/argon2`. `libphonenumber-js` for E.164. `date-fns` + `date-fns-tz`. `lucide-react` icons. Recharts charts. `pdf-lib` receipts. `ics` + Google Calendar links. `mercadopago` SDK. Resend and Meta WhatsApp Cloud API through plain `fetch`. Vitest unit tests, Playwright E2E. Node 22.18. npm.

No component library, no second UI kit, no light mode.

## Repository conventions

Target tree is in `docs/BUILD-PLAN.md`. Rules:

- Server Components by default. Client Components only for forms, calendar, cart, charts, toggles, and consent/analytics.
- Mutations go through Server Actions or route handlers, always validated with Zod. Webhooks and cron are route handlers, never Server Actions.
- Business logic lives in `lib/` (`db/ auth/ availability/ orders/ payments/ notifications/ loyalty/ reviews/ favorites/ receipts/ validation/ format/`), never in components.
- No Prisma calls from Client Components. Never fetch your own route handler from a Server Component.
- Import only through the `@/` alias; relative parent imports fail lint. Import order is enforced (`import/order`). Type-only imports use `import type`.
- Prettier owns formatting: single quotes, no semicolons, 100 columns, one attribute per line. Do not fight it.
- UI copy is Portuguese. Code identifiers, enums, tables, and columns stay English as declared in `docs/DATA-MODEL.md` (`@@map`/`@map` to snake_case).
- Comments only for a non-obvious constraint. No narration, no banners, no commented-out code.

## Domain invariants — never break these

**Money.** Integer cents everywhere (`priceCents`, `amountCents`, `totalCents`). Never floats. Render with `formatBRL` from `lib/format/money.ts` (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`). Numbers use `tabular-nums`.

**Time.** Store UTC (`timestamptz`). Compute business dates, weekdays, and "today" in `America/Sao_Paulo` with `date-fns-tz`. Dates without time use `date`. Weekday `0` is Sunday. Times of day are integer minutes from midnight, never `HH:mm` strings in the database.

**Slots.** Grid 15 minutes, service duration 10–90 minutes, lead time 30 minutes, horizon 60 days. Candidate starts run from `openMinute` to `closeMinute - durationMin`. Drop candidates that overlap an appointment with status `PENDING` or `CONFIRMED`, or an active recurring/one-off time block. Overlap rule: `candidateStart < existingEnd && candidateEnd > existingStart`. Availability is computed server-side; the client never decides. A slot is held only when an order is created, never from the cart. No "qualquer profissional" option.

**Double-booking is prevented by the database**, not only by application code:

```sql
ALTER TABLE appointments
ADD CONSTRAINT appointments_active_no_overlap
EXCLUDE USING gist (barber_id WITH =, tstzrange(start_at, end_at) WITH &&)
WHERE (status IN ('PENDING', 'CONFIRMED'));
```

Order creation runs in a serializable transaction, revalidates every line, relies on the exclusion constraint for the final check, and returns a friendly "slot taken" conflict. Two lines for the same barber in one order may not overlap; back-to-back is allowed.

**Stock.** `Product.stock` (physical) and `Product.reserved` (held by unpaid orders). Sellable = `stock - reserved`, never negative. Reserve at order creation, decrement on paid, release on expiry/cancel, restock on refund before pickup. Use a conditional update: `UPDATE products SET reserved = reserved + $qty WHERE id = $id AND stock - reserved >= $qty`. Every change writes an `InventoryMovement`.

**Orders.** Code `BL-#####`, unique, stored without `#` and rendered as `#BL-8472`. Statuses: `PENDING_PAYMENT OPEN PAID PARTIALLY_REFUNDED REFUNDED CANCELED EXPIRED`. Online orders hold for 15 minutes and expire. Pay-at-chair is only for service-only orders (`ON_SITE`), and its appointments stay `PENDING` until the barber confirms. Revenue is `sum(payments.amountCents - payments.refundedCents)`, never order totals, never pending/canceled/no-show.

**Cancellation and refunds.** Free cancel more than 2h before start, with refund of prepaid amounts. At 2h or less → `CANCELED_LATE`, no refund. Reschedule keeps the same appointment identity; a paid line stays paid with any difference charged or refunded. Products are refundable before pickup, not after. Partial refunds are recorded per line against the payment.

**Loyalty.** One stamp per completed service appointment; products earn none. At 15 stamps, issue one credit (90-day expiry) and reset stamps to 0. At most one `AVAILABLE` credit per account, enforced by a partial unique index. If 15 stamps are reached while a credit is active, stamps hold at 15. Credit covers one service line at checkout and is restored if the order expires or is canceled. Tiers by lifetime completed visits: Bronze 0–9, Gold 10–19, Platinum 20+. Lifetime visits never decrease. Every change writes an append-only `LoyaltyEntry`.

**No-shows.** Third no-show sets `bookingBlocked`; the owner unblocks and resets the counter. Blocked customers cannot create online orders; staff can still book manually.

**Deletion.** Orders, payments, appointments, and ledger rows are never hard-deleted. Use `active` flags and status transitions.

## Roles and scoping

Three roles: `CUSTOMER`, `BARBER`, `OWNER`. Luiz is `OWNER` **and** has a `BarberProfile`; Hinner and Carlos are `BARBER` with profiles.

Enforce scope in every query with an actor, not only in navigation. A barber sees only their own agenda, clients (customers with appointments with them), counts, and blocks; they may create manual bookings only for themselves. Finance, settings, catalog, team, and unblocking are owner-only. A barber hitting those routes gets 403, not a hidden link. Customers see only their own orders, appointments, favorites, reviews, and profile.

## Auth

At least one identifier: unique E.164 phone (any country, validated with `libphonenumber-js`) or unique lowercase email, plus a password.

- Phone signup: WhatsApp OTP, 6 digits, 10-minute TTL, max 5 attempts.
- Email signup: Resend verification link, 24-hour TTL, non-blocking.
- Password reset: email link (30 minutes) or WhatsApp OTP for phone-only accounts.
- Sessions: opaque 32-byte token, SHA-256 hash in `sessions`, httpOnly/Secure/SameSite=Lax cookie, 30-day sliding expiry. Server-revocable.
- Passwords: Argon2id.
- Rate limit login, OTP, registration, and checkout.
- Disposable email domains rejected at registration only, by domain, through Disify. Timeout 2.5s, fail open on any error, 24-hour in-memory cache (max 1,000 domains, oldest evicted, failures not cached). Only the domain leaves the server.
- Guest checkout creates a `User` with `passwordHash = null`; activation sets a password. Until then the order is reachable by code and contact verification.
- Demo mode: `DEMO_MODE=true` exposes one-click logins for owner, barber, and customer against a seeded database. Production startup must refuse `DEMO_MODE=true`.

## Payments

Mercado Pago Checkout Pro for online PIX, credit, and debit. Cash, card, or PIX at the chair for service-only orders. Any product in the order forces online prepayment. The Figma "Cielo" label is mock copy — the UI says Mercado Pago.

The webhook validates the signature, is idempotent by `providerPaymentId` plus order-status guards, and on `paid` confirms every appointment line, decrements stock, marks the receipt ready, and sends notifications. Expiry or failure cancels the lines and releases stock and slots. A provider outage never rolls back a booking.

Receipts are generated on demand from `Payment` rows and never stored. They are emailed as a link.

## Notifications

Resend for email, Meta WhatsApp Cloud API for WhatsApp, both through plain `fetch` behind a port + factory + console adapter, following the `pacepilot` structure. Message kinds: confirmation, 24h reminder, cancellation, reschedule, receipt link, no-show block, OTP, email verification, password reset. ICS attachment plus Google Calendar link; no OAuth sync. Instagram is a profile link only. No SMS.

Hourly cron scans appointments 23–25 hours ahead and sends once; `NotificationLog.dedupeKey` guarantees once. Delivery is best-effort and logged; a failure never breaks a booking or payment.

## Design system

Tokens live in `app/globals.css` and are mapped in `tailwind.config.js`. Use the mapped utility names — `bg-surface`, `bg-shell`, `text-accent`, `text-muted`, `border-border`, `rounded-xl`, `text-body`, `text-label`, `text-metric`, `min-h-touch` — not arbitrary values or raw hex.

- Orange `#D35F27` (`primary`) means action. Gold `#EAA83A` (`accent`) means value and brand. Never decoration. Green is success only.
- Dark only. Flat surfaces, 1px borders, no glow, glass, neumorphism, or light mode.
- Fonts via `next/font`: Inter for everything.
- Lucide icons only, 2px stroke, no emoji, no custom SVG set.
- Customer screens are mobile-first at 390px; admin is desktop-first at 1440px, usable to 1024px, with no mobile admin layout.
- Loading uses skeletons shaped like the final content, never spinner-only screens. Errors keep form values. Destructive actions require confirmation.
- Focus ring: 2px `--accent` with 2px offset. Click targets ≥ 44px on mobile. The slot picker is a radio group. Charts, stamp grids, and calendars need text alternatives. No meaning by color alone.

The landing page is specified screen by screen in `docs/LANDING-PAGE-SPEC.md`: one `h1`, PT-BR, `ABERTO AGORA` only when open, `AGENDAR AGORA` → `/servicos`, perks → `/loja`, `LocalBusiness` JSON-LD, 1120px desktop max, `next/image` with priority on the hero. No blog, pricing table, testimonial carousel, or long marketing page.

## Screens and routes

Public/customer: `/`, `/servicos`, `/servicos/[slug]`, `/agendar/[serviceId]/profissional`, `/agendar/[serviceId]/horario`, `/agendar/resumo`, `/carrinho`, `/pedido/[code]`, `/loja`, `/conta/agendamentos`, `/conta/historico`, `/conta/perfil`, `/conta/favoritos`, `/entrar`, `/criar-conta`, `/verificar-email`, `/recuperar-senha`.

Admin: `/admin`, `/admin/agenda`, `/admin/clientes`, `/admin/catalogo`, `/admin/financeiro`, `/admin/configuracoes`. Manual booking opens as a drawer from Dashboard, Agenda, or Clients.

Route handlers planned: `api/auth`, `api/bookings`, `api/orders`, `api/availability`, `api/webhooks/mercadopago`, `api/webhooks/whatsapp`, `api/cron/reminders`, `api/cron/expire-holds`, `api/cron/expire-credits`, `api/receipts/[paymentId]`, plus `api/health` (exists).

## Environment

Every variable is in `.env.example`; add new ones there and in the Render blueprint. Server secrets never get `NEXT_PUBLIC_`. Demo mode is forbidden in production. No secret, PII, CPF, phone, or email in logs, analytics, or Sentry payloads.

GTM loads only after consent (`bl.analytics.consent.v1`); the GA4 tag inside the container sets `send_page_view: false`, and `lib/analytics/gtm.ts` pushes `page_view` on route change. Events are typed in `lib/analytics/events.ts` and carry behavior only, never identifiers. Sentry runs with `sendDefaultPii: false`, scrubbed headers, PII-safe replay, and stays silent when no DSN is set.

## Commands and tests

```bash
npm run dev          # Next dev
npm run build        # prisma generate + next build
npm run start
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # tsc --noEmit, strict
npm test             # Vitest
npm run test:e2e     # Playwright
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:studio
```

Add `db:seed` when the seed lands. `npm run typecheck`, `npm run lint`, and the test suites must pass before a phase is called done.

Test what the docs call out:

- **Unit** — slot generation at boundaries, all durations, lunch block, one-off block, closed day, lead time, horizon; overlap math; order totals (services + products − credit); loyalty stamp/15th/active-credit/tier/use/restore/expiry; no-show trigger and reset; appointment and order state transitions.
- **Integration** — parallel order creation against the exclusion constraint; stock reservation under concurrency; Mercado Pago webhook idempotency; hold expiry; partial refund reconciliation.
- **E2E** — the eight paths in `docs/BUILD-PLAN.md`, including the two-barber multi-line order, product forcing online payment, pay-at-chair completion, cancel before/after 2h, three no-shows and unblock, owner vs barber scoping, and demo login for all three roles. Payments only use sandbox or a signed test webhook, never live money.

## Build order

1. Foundation — Prisma schema, migrations with raw SQL constraints, seed, env validation, auth, sessions, roles, shells, UI primitives.
2. Catalog and shop — services, products, barbers, hours, blocks, owner CRUD, public catalog and store.
3. Booking — slot engine with tests, availability API, calendar and slot picker, barber selection, summary, multi-line cart, server revalidation.
4. Commerce — order transaction, holds, stock, Mercado Pago preference and webhook, at-chair payments, receipts, refunds, revenue queries.
5. Notifications — Resend and WhatsApp adapters, templates, OTP, ICS, reminder cron, logs.
6. Admin — dashboard, agenda, clients, catalog, finance, settings, manual booking, no-show block.
7. Customer — appointments, history, profile, favorites, loyalty, reviews, repeat booking.
8. Demo and ship — full relative-date seed, one-click logins, E2E, accessibility and performance pass, deploy runbook.

## Do not

- Do not add AI, LLMs, chat booking, or model-based recommendations. The product explicitly excludes them.
- Do not build multi-shop, multi-tenant, marketplace, delivery, shipping, SMS, push, 2FA, file uploads, Google Calendar OAuth, Instagram API, payroll, commissions, NF-e, subscriptions, deposits, coupons, waitlists, English, multi-currency, or light mode.
- Do not use floats for money, local time in the database, or `HH:mm` strings in columns.
- Do not let the client compute availability, prices, totals, or role scope. The server decides.
- Do not hard-delete orders, payments, appointments, or loyalty ledger rows.
- Do not use a mock data layer for demo mode; demo is a seeded Postgres with identical query paths.
- Do not introduce a component library, a second UI kit, emoji icons, gradients as decoration, or green primary actions.
- Do not leave a `Clip` string, or any copy from the old scaffold, in the UI.

## Before you finish

- Run `npm run typecheck`, `npm run lint`, `npm run format:check`, and the relevant tests; fix what they report.
- Verify the acceptance criteria for the phase you touched, and the PRD criteria they support.
- Exercise the affected flow in the browser at 390px and 1440px, including the error and empty states.
- State what you changed, which phase it belongs to, and anything still missing.
