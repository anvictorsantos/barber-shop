# MVP-SCOPE — Barbearia do Luiz

> MoSCoW for the smallest shippable that satisfies the PRD. Everything else is post-MVP.

## Must

### Foundation

- Next.js App Router + TypeScript + Tailwind + Prisma + PostgreSQL.
- Tooling: ESLint, Prettier, Husky, lint-staged, Vitest, Playwright, GTM with consent, Sentry, Render blueprint.
- Design tokens from `DESIGN-GUIDELINES.md`.
- Prisma schema for shop, users, sessions, barbers, services, products, hours, blocks, appointments, orders, product lines, payments, refunds, reviews, loyalty, favorites, notifications, inventory movements.
- Transactional seed: shop, 9 services, 3 barbers, 4 products, customers, appointments across the week, paid orders, walk-in, reviews, loyalty stamps.
- `.env.example` with every required variable.
- Health check and structured error handling.

### Auth

- Signup with phone or email + password.
- E.164 phone validation, any country.
- WhatsApp OTP at phone signup.
- Email verification link via Resend, non-blocking.
- Disposable email rejection through Disify, fail open.
- Login with phone or email + password.
- Password reset by email link or WhatsApp OTP.
- Opaque session token in httpOnly cookie; `Session` table; 30-day sliding expiry.
- Argon2id password hashing.
- Roles: customer, barber, owner. Route and query scoping.
- Guest checkout with account creation and activation.
- Demo mode with one-click logins.

### Catalog and shop

- Services CRUD: name, category, duration 10–90, price, promo, image URL, active.
- Products CRUD: name, price, stock, image URL, active.
- Barbers: display name, title, avatar, active.
- Shop hours per weekday.
- Recurring and one-off time blocks.
- Owner-only management; barber read scoping.

### Slot engine

- Pure function: shop hours + blocks + active appointments + 15-minute grid + lead time + horizon.
- Overlap rule `start < end && end > start`.
- Server-side validation on every order.
- Database exclusion constraint for active appointments per barber.
- No “qualquer profissional”.

### Booking flow

- Landing, catalog, service detail, barber selection, calendar, time selection, summary, cart, confirmation.
- Multi-service cart with independent barber/date/time per line.
- Guest cart in browser.
- Add-to-cart, edit, remove, revalidate.
- “Repetir último serviço”.

### Orders and payments

- One order: appointments + product lines + one payment context.
- Order code `#BL-#####`.
- Online: Mercado Pago Checkout Pro, PIX + credit + debit.
- Pay at chair for service-only orders.
- Products require online prepayment.
- 15-minute hold for unpaid orders.
- Stock reserve/release/decrement.
- Idempotent Mercado Pago webhook.
- At-chair payment recording on completion.
- Partial refunds per line.
- PDF receipt, download and email link.
- Revenue = collected minus refunds.

### Notifications

- WhatsApp confirmation, 24h reminder, cancellation, reschedule, no-show block.
- Email confirmation, reminder, cancellation, reschedule, receipt, verification, reset.
- ICS attachment and Google Calendar link.
- Hourly reminder cron with idempotency.
- Console adapters in development.
- No SMS.

### Admin

- Dashboard: today count, collected today, next client, free slots, weekly strip, blocks, queue.
- Agenda: filters, month calendar, day list, summary, next appointment, new booking.
- Clients: search, status, sort, table, detail, no-show count, block/unblock.
- Services and products: cards, toggles, stock adjustments.
- Finance: monthly/weekly revenue, average ticket, total services, monthly chart, popular services, revenue by barber, recent payments.
- Settings: business data, hours, team, notifications, integrations status, payment methods.
- Role-scoped navigation and queries.

### Customer account

- Meus Agendamentos: upcoming lines, next appointment, cancel, reschedule, repeat.
- Histórico: filters, table, ratings, receipt download.
- Perfil: personal data, optional CPF/birthdate/address, security, stats, tier progress, preferences, notification toggles.
- Favoritos: barbers, services, products, reorder.
- Loyalty card, stamps, credit, tier.
- Reviews: 1–5 + optional private comment.

### Platform

- PT-BR, BRL, `America/Sao_Paulo`.
- Mobile 390 and desktop 1440.
- Accessibility baseline.
- Rate limits on auth and checkout.
- No PII in logs.
- Demo guard in production.
- Playwright E2E for the critical paths.

## Should

- CSV export on Finance.
- Search and filters on admin lists.
- Low-stock warning.
- Empty states, skeletons, toasts.
- Cookie/LGPD notice.
- Static “recommended for you” rules on Favoritos.
- Booking conflict auto-retry UI.
- Receipt resend action.
- Notification log viewer in Settings.
- Audit trail for status changes and stock adjustments.

## Could

- File uploads for images.
- Google Calendar OAuth sync.
- Instagram feed.
- Product variants and bundles.
- Commissions per barber.
- Deposits for high-value services.
- Coupons.
- Waitlist.
- SMS fallback.
- 2FA.
- PWA.
- English.

## Won’t

- AI, LLM, recommendations by model.
- Multi-shop, multi-location, franchise, marketplace.
- Delivery, shipping, Correios.
- Payroll, NF-e.
- Light mode.
- Native mobile app.

## Milestones

1. **Foundation** — Next app, tokens, Prisma schema, migrations, seed, env, auth, sessions, roles, shells.
2. **Catalog** — services, products, barbers, hours, blocks, admin CRUD, image URLs.
3. **Booking** — slot engine with tests, catalog/detail/barber/date/summary screens, multi-line cart, availability API.
4. **Commerce** — orders, holds, stock, Mercado Pago, webhook, at-chair payments, receipts, refunds.
5. **Notifications** — Resend, WhatsApp templates, OTP, ICS, reminder cron, logs.
6. **Admin** — dashboard, agenda, clients, finance, settings, manual booking, no-show block.
7. **Customer** — appointments, history, profile, favorites, loyalty, reviews.
8. **Demo and polish** — seeded demo logins, E2E, accessibility pass, performance pass, deploy runbook.

Each milestone ends with a runnable app and a short acceptance demo.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Meta WhatsApp template approval delays | Build console fallback; submit templates in milestone 1; do not block UI on WhatsApp |
| MP webhook unreachable locally | Use a tunnel for tests; verify signature; idempotency table; manual reconcile action |
| Multi-line cart creates race conditions | Revalidate all lines in one transaction; exclusion constraint; clear conflict UI |
| Timezone drift around midnight | Store UTC; compute local dates with `date-fns-tz`; test DST boundaries |
| Stock oversell | Reserve at order creation; `stock >= 0` check; inventory movements; expiry cron |
| Partial refund complexity | Refund per payment line; record provider refund id; finance shows net |
| Guest account activation confusion | Activation link + order code page; clear copy; resend action |
| Demo data leaks into production | `DEMO_MODE` guard; production startup refuses demo |
| Receipt generation failure | Generate on demand; email a link, not an attachment; retry action |
| WhatsApp OTP not deliverable | Fall back to email signup; never block an email-only account |

## Done means

- All Must items work end to end.
- PRD acceptance criteria pass.
- Slot, pricing, loyalty, and order state tests are green.
- Playwright covers booking, payment, cancel, loyalty, and role scoping.
- Demo mode runs from a fresh database with one seed command.
- No `Clip` strings remain.
- Deploy runbook is documented.
