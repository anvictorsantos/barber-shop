# BUILD-PLAN — Barbearia do Luiz

> How the app is built, tested, and shipped. No code starts until this plan is accepted.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, latest stable) + React + TypeScript strict |
| Styling | Tailwind CSS + CSS custom properties from `DESIGN-GUIDELINES.md` |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | Custom sessions: Argon2id + opaque token in httpOnly cookie |
| Validation | Zod |
| Phone | `libphonenumber-js` |
| Dates | `date-fns` + `date-fns-tz` |
| Icons | `lucide-react` |
| Charts | Recharts |
| PDF | `pdf-lib` |
| Calendar | `ics` + Google Calendar link |
| Email | Resend via plain `fetch` (structure copied from `pacepilot`) |
| WhatsApp | Meta WhatsApp Cloud API via plain `fetch` |
| Payments | Mercado Pago Checkout Pro |
| Analytics | Google Tag Manager, consent-gated |
| Observability | Sentry (Next.js SDK, same-origin tunnel) |
| Unit tests | Vitest |
| E2E | Playwright |
| Package manager | npm |
| Deploy | Render web service + Render Cron + Neon Postgres |

No component library. No AI. No second UI kit.

## Repository shape

```
app/
  (public)/
    page.tsx                 landing
    servicos/                catalog and detail
    loja/                    products
    agendar/                 booking flow
    carrinho/                cart and checkout
    pedido/[code]/           confirmation
    entrar/ criar-conta/ recuperar-senha/ verificar-email/
  (customer)/
    conta/agendamentos/ historico/ perfil/ favoritos/
  admin/
    page.tsx agenda/ clientes/ catalogo/ financeiro/ configuracoes/
  api/
    auth/ bookings/ orders/ availability/
    webhooks/mercadopago/ webhooks/whatsapp/
    cron/reminders/ cron/expire-holds/ cron/expire-credits/
    receipts/[paymentId]/
components/
  ui/ layout/ booking/ admin/ charts/
lib/
  db/ auth/ availability/ orders/ payments/ notifications/
  loyalty/ reviews/ favorites/ receipts/ validation/ format/
prisma/
  schema.prisma migrations/ seed.ts
tests/
  unit/ integration/ e2e/
docker-compose.yml            local Postgres
.env.example
```

Rules:

- Server Components by default. Client Components only for forms, calendar, cart, charts, and toggles.
- Mutations use Server Actions or route handlers with Zod validation.
- Webhooks and cron use route handlers, never Server Actions.
- Business logic lives in `lib/`, not in components.
- No Prisma calls from Client Components.

## Environment

```dotenv
DATABASE_URL=
DIRECT_URL=
SESSION_SECRET=
APP_URL=http://localhost:3000
SHOP_TIMEZONE=America/Sao_Paulo

RESEND_API_KEY=
EMAIL_FROM="Barbearia do Luiz <no-reply@...>"
EMAIL_REPLY_TO=
EMAIL_ENABLED=true

WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_TEMPLATE_CONFIRMATION=
WHATSAPP_TEMPLATE_REMINDER=
WHATSAPP_TEMPLATE_CANCELED=
WHATSAPP_TEMPLATE_RESCHEDULED=
WHATSAPP_TEMPLATE_OTP=
WHATSAPP_TEMPLATE_NO_SHOW_BLOCK=

MERCADO_PAGO_ENABLED=true
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

CRON_SECRET=
DEMO_MODE=false

NEXT_PUBLIC_GTM_ID=

NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENV=development
NEXT_PUBLIC_SENTRY_REPLAY_ENABLED=false
SENTRY_DSN=
SENTRY_ENV=development
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

- GTM loads only after the consent banner is accepted. The GA4 tag inside the container must not send its own page views.
- Sentry reports through `/api/sentry`; no DSN means the SDK is silent.
- Production startup fails if `DEMO_MODE=true`.
- Missing email key in production fails email construction; development logs to console.
- Missing WhatsApp key falls back to console in development; production surfaces a configuration error.
- No secret is ever logged.

## Commands

```bash
npm install
docker compose up -d          # local Postgres
npm run db:migrate
npm run db:seed
npm run dev
npm test
npm run test:integration
npm run test:e2e
npm run build
npm run lint
npm run typecheck
```

## Delivery phases

### Phase 1 — Foundation

- Next app, TypeScript strict, Tailwind tokens, fonts, base UI primitives.
- ESLint, Prettier, Husky, lint-staged, Vitest, Playwright.
- GTM with consent gate, Sentry client/server/edge, Render blueprint.
- Prisma schema, migrations, raw SQL constraints, seed skeleton.
- Env validation, health check, error boundary.
- Auth: signup, login, sessions, roles, OTP, email verification, disposable email check, password reset, activation.
- Layout shells: public, customer, admin.
- Demo login endpoints behind guard.

Verify: owner, barber, and customer can log in; role scoping blocks forbidden routes.

### Phase 2 — Catalog and shop

- Shop, services, products, barbers, hours, time blocks.
- Admin CRUD for owner.
- Image URL fields.
- Public catalog, service detail, store.
- Seed the Figma catalog.
- Barber read scoping.

Verify: owner edits data; customer sees it immediately; barber cannot open management screens.

### Phase 3 — Booking

- Slot engine with unit tests.
- Availability route handler.
- Calendar and slot picker.
- Barber selection.
- Summary screen.
- Multi-service cart with independent lines.
- Guest cart persistence.
- Cart edit/remove.
- Server-side revalidation.

Verify: slot conflicts rejected; multi-line cart validates each line; no double-booking under parallel requests.

### Phase 4 — Commerce

- Order creation transaction.
- Order code.
- Holds and expiry.
- Stock reservation and release.
- Mercado Pago preference and webhook.
- At-chair payment recording.
- Receipts.
- Refunds.
- Revenue queries.

Verify: paid order confirms lines; expired order releases slots/stock; receipt downloads; partial refund nets correctly.

### Phase 5 — Notifications

- Resend sender, templates, console adapter.
- WhatsApp sender, templates, console adapter.
- OTP delivery.
- Confirmation, reminder, cancel, reschedule, block messages.
- ICS generation and Google Calendar link.
- Reminder cron.
- Notification logs.

Verify: each event sends once; failures are logged and do not break the transaction.

### Phase 6 — Admin

- Dashboard, agenda, clients, finance, settings.
- Manual booking and walk-in.
- No-show marking and block/unblock.
- Time blocks.
- Finance metrics and chart.
- Role-scoped queries.

Verify: barber sees own only; owner sees all; revenue matches collected payments.

### Phase 7 — Customer account

- Appointments, history, profile, favorites.
- Loyalty stamps, credit, tier.
- Reviews.
- Repeat booking.
- Receipt download.
- Notification preferences.

Verify: stamps and credit are exact; review is one per appointment; favorites persist.

### Phase 8 — Demo and ship

- Full seed with relative dates.
- Demo one-click logins.
- Playwright critical paths.
- Accessibility and performance pass.
- Deploy runbook.
- Real assets and credentials.

Verify: fresh database → seed → full demo without manual data entry.

## Testing strategy

**Unit**

- Slot generation: opening/closing boundaries, 10–90 min durations, 15-min grid, lunch block, one-off block, closed day, lead time, horizon.
- Overlap math.
- Order totals: services + products − credit.
- Loyalty: stamp, 15th stamp, active-credit hold, tier thresholds, credit use/restore/expiry.
- No-show: 3rd trigger, owner reset.
- Appointment and order state transitions.

**Integration**

- Parallel order creation against the exclusion constraint.
- Stock reservation under concurrency.
- Mercado Pago webhook idempotency.
- Hold expiry releasing stock and slots.
- Partial refund reconciliation.

**E2E (Playwright)**

1. Landing → catalog → service → barber → slot → cart → checkout → confirmation.
2. Two services with different barbers in one order.
3. Product added to cart → pay-at-chair disabled → online payment path.
4. Pay-at-chair → barber confirms → completes → payment and stamp.
5. Cancel >2h → refund; cancel ≤2h → late cancel, no refund.
6. Three no-shows → block; owner unblocks.
7. Owner vs barber route scoping.
8. Demo login for all three roles.

Payment E2E uses Mercado Pago sandbox or a signed test webhook. Never live money.

## Deployment runbook

1. Create Neon Postgres; set `DATABASE_URL` and `DIRECT_URL`.
2. Create a Render Blueprint from `render.yaml`; set `APP_URL` to the service URL.
3. Add all provider env vars: Resend, WhatsApp, Mercado Pago, GTM, Sentry.
4. Render build runs `npm ci && npm run build`; start runs `npm run db:deploy && npm start`.
5. Configure Render Cron jobs after Phase 5:
   - hourly: `/api/cron/reminders`
   - every 5 minutes: `/api/cron/expire-holds` and `/api/cron/expire-credits`
   - every job sends `Authorization: Bearer $CRON_SECRET`
6. Configure Mercado Pago webhook URL: `https://<domain>/api/webhooks/mercadopago`.
7. Configure WhatsApp webhook URL and verify token.
8. Verify the Resend sender domain.
9. Submit and approve Meta WhatsApp templates.
10. Create the Sentry project and set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps.
11. Create the GTM container and set `NEXT_PUBLIC_GTM_ID`.
12. Do not run the demo seed in production. A catalog-only seed is required before launch.
13. Set `DEMO_MODE=false` and confirm the startup guard.

## Required inputs before production

- Real shop data: legal name, CNPJ, address, phone, WhatsApp, contact email, social URLs.
- Final images for services, products, and barbers.
- Resend account with a verified sending domain.
- Meta WhatsApp Business account, phone number, and approved templates.
- Mercado Pago production credentials and webhook secret.
- GTM container ID and GA4 tag configured with manual page views.
- Sentry project, DSN, and org auth token.
- Render and Neon accounts.
- Domain name.

## Risks

| Risk | Response |
|---|---|
| Meta template approval is slow | Console adapter and UI don’t wait; templates submitted early |
| Mercado Pago webhook is hard to test locally | Tunnel + signed test payloads + idempotency tests |
| Multi-line cart race | Exclusion constraint + serializable transaction + clear conflict UX |
| Stock oversell | `stock - reserved >= qty` conditional update + checks |
| Timezone bugs | UTC storage, `date-fns-tz`, explicit timezone tests |
| Partial refund edge cases | Per-payment refund model; net revenue query; tests |
| Guest activation confusion | Activation link, order code page, resend action |
| Demo leak to production | Startup refuses `DEMO_MODE=true` in production |
| WhatsApp OTP deliverability | Email signup remains available; no hard dependency |
| PDF generation cost | Generate on demand; cache headers; no file storage |

## Definition of done

- PRD acceptance criteria pass.
- Unit and integration suites are green.
- Playwright critical paths pass.
- Demo runs from a fresh database with one seed command.
- No `Clip` copy remains.
- Owner, barber, and customer see only their permitted data.
- No secret or PII in logs.
- Deploy runbook executed once against a staging environment.
