# PRD — Barbearia do Luiz

## 1. Summary

Single-shop booking and commerce app. A customer books one or more services, optionally adds products, pays online or at the chair, and receives WhatsApp/email confirmation. Staff manage the queue, clients, catalog, stock, money, and settings. Loyalty, reviews, and favorites are built on the appointment ledger.

Language: PT-BR. Currency: BRL. Timezone: `America/Sao_Paulo`. No AI.

## 2. Roles and permissions

| Capability | Customer | Barber | Owner |
|---|---|---|---|
| Book services | own | — | — |
| Buy products | own | — | — |
| View own orders/appointments | yes | — | — |
| View own dashboard/agenda | — | own only | all |
| View clients | — | own clients only | all |
| Change appointment status | — | own appointments | all |
| Create manual/walk-in booking | — | for self | any barber |
| Block time | — | own | any barber |
| Manage services | — | no | yes |
| Manage products/stock | — | no | yes |
| View finance | — | no | yes |
| Manage team/barbers | — | no | yes |
| Manage shop info/hours/settings | — | no | yes |
| Unblock a no-show customer | — | no | yes |

- **Luiz** is the owner and also a bookable barber.
- **Hinner** and **Carlos** are barbers with logins.
- Staff use the same admin shell; navigation and queries are scoped by role.
- A barber never sees another barber’s agenda, clients, or money totals.
- A barber may see the shop-wide “open now” state and own counts only.

## 3. Screens and routes

### Public / customer

| # | Screen | Route |
|---|---|---|
| 1 | Landing | `/` |
| 2 | Catálogo de Serviços | `/servicos` |
| 3 | Detalhe do Serviço | `/servicos/[slug]` |
| 4 | Escolha do Profissional | `/agendar/[serviceId]/profissional` |
| 5 | Data e Horário | `/agendar/[serviceId]/horario` |
| 6 | Resumo do Agendamento | `/agendar/resumo` |
| 7 | Carrinho / Checkout | `/carrinho` |
| 8 | Agendamento Confirmado | `/pedido/[code]` |
| 9 | Loja | `/loja` |
| 10 | Meus Agendamentos | `/conta/agendamentos` |
| 11 | Histórico | `/conta/historico` |
| 12 | Perfil | `/conta/perfil` |
| 13 | Favoritos | `/conta/favoritos` |
| 14 | Entrar | `/entrar` |
| 15 | Criar conta | `/criar-conta` |
| 16 | Verificar e-mail | `/verificar-email` |
| 17 | Recuperar senha | `/recuperar-senha` |

### Admin

| # | Screen | Route |
|---|---|---|
| 18 | Dashboard | `/admin` |
| 19 | Agenda | `/admin/agenda` |
| 20 | Clientes | `/admin/clientes` |
| 21 | Serviços e Produtos | `/admin/catalogo` |
| 22 | Financeiro | `/admin/financeiro` |
| 23 | Configurações | `/admin/configuracoes` |

Manual booking opens as a drawer/modal from Dashboard, Agenda, or Clientes.

Responsive rules:

- Customer side is mobile-first at 390px and scales to 1440px.
- Admin is desktop-first at 1440px, usable down to 1024px. No mobile admin layout in v1.
- Figma is the visual contract for every screen. Loja and auth screens follow the same tokens and component shapes.

## 4. Customer flows

### 4.1 Book one service

1. Landing → `Agendar` → Catálogo.
2. Service detail shows image, name, promo badge, price, description, duration, CTA.
3. Choose barber. No “qualquer profissional” option.
4. Choose date and available slot.
5. Summary shows service, barber, date/time, price, and “Cancelamento gratuito com até 2h de antecedência”.
6. Add to cart. Customer may repeat for more services or add products.
7. Checkout. Guest or logged in.
8. Confirm and pay, or choose pay at chair when the cart has no products.
9. Confirmation shows order code, service, barber, date/time, WhatsApp reminders toggle, and “Ver meus agendamentos”.

### 4.2 Book many services

- Each service line keeps its own barber, date, and time.
- The cart lists every line and validates all slots at checkout.
- Two lines for the same barber may not overlap.
- One order, one payment context. Online payment covers all lines.

### 4.3 Buy products

- Loja lists active products with price and stock status.
- Customer adds quantity to cart.
- Products are pickup only and require online prepayment.
- A cart with any product cannot use pay at chair.
- Product-only orders are allowed and produce no appointment.

### 4.4 Payment

- **Online:** Mercado Pago Checkout Pro. PIX, credit card, debit card.
- **At chair:** cash, card, or PIX. Only when every line is a service.
- Paid online → all appointments become `confirmed`.
- At chair → appointments stay `pending` until the barber confirms; payment is recorded on completion.

### 4.5 Cancel and reschedule

- Free cancel more than 2h before start. Refund prepaid amount.
- Cancel 2h or less before start → `canceled_late`. No refund.
- Reschedule keeps the same appointment line; paid stays paid; price difference charged or refunded.
- Products refundable before pickup; not after.
- Partial refunds are supported per line.

### 4.6 Loyalty, reviews, favorites

- Completed service earns one stamp.
- 15 stamps → one free service credit, valid 90 days.
- Credit applies to one service line at checkout.
- After completion the customer may rate 1–5 and leave a private comment.
- Customer may favorite barbers, services, and products.
- “Repetir último serviço” rebooks the latest service with the same barber.

## 5. Auth and identity

- Signup fields: name, phone or email (at least one), password.
- Login identifier: phone or email plus password.
- Phone stored in E.164. Any country accepted. Validated with `libphonenumber-js`.
- Phone signup requires a WhatsApp OTP: 6 digits, 10-minute TTL, max 5 attempts.
- Email signup sends a verification link: 24-hour TTL, non-blocking.
- Disposable email domains rejected at registration only.
- Password reset: email link (30 minutes) or WhatsApp OTP for phone-only accounts.
- Sessions: opaque token, SHA-256 hash in database, httpOnly/Secure/SameSite=Lax cookie, 30-day sliding expiry.
- Password hashing: Argon2id.
- Rate limits on login, OTP, registration, and checkout.

### Guest checkout

- A guest fills name, email and/or WhatsApp, and CPF when required by the payment provider.
- An account is created after a successful order.
- If email exists, send an activation link to set a password. If email is absent, activation happens later when email is added.
- Until activation, the order is reachable by code and contact verification.

## 6. Catalog

### Services (seed)

| Category | Name | Duration | Price | State |
|---|---|---|---|---|
| Corte e Barba | Corte + Barba | 40 min | R$60 | active, promo “DE R$70” |
| Corte | Corte Tesoura + Máquina | 30 min | R$45 | active |
| Corte | Corte Kids | 25 min | R$45 | active |
| Barba | Barba Terapia | 35 min | R$45 | active |
| Barba | Barba | 20 min | R$35 | active |
| Pezinho | Pezinho | 10 min | R$10 | active |
| Químicas | Progressiva Masculina | 90 min | R$60 | active |
| Químicas | Botox Capilar | 60 min | R$70 | active |
| Químicas | Relaxamento | 45 min | R$60 | inactive |

Service fields: slug, name, description, category, duration 10–90 min, price cents, optional original price, promo label, image URL, active, sort order.

### Products (seed)

| Name | Price | Stock |
|---|---|---|
| Pomada Modeladora Matte | R$35 | 15 |
| Óleo Pós-Barba Eucalyptus | R$28 | 8 |
| Loção Pós-Barba Shave | R$30 | 12 |
| Cerveja Gelada Stella Artois | R$8 | 48 |

Product fields: slug, name, description, price cents, integer stock, image URL, active.

Product completion levels are not modeled. One product = one stock count.

### Barbers (seed)

| Name | Title | Rating |
|---|---|---|
| Luiz Silva | Proprietário / Master Barber | 5.0 (240+) |
| Hinner Santos | Barbeiro Sênior | 4.9 (180+) |
| Carlos Heitor | Barbeiro Sênior | 4.8 (120+) |

Barber fields: user, display name, title, bio, avatar URL, active, sort order. Rating aggregate is computed.

### Shop (seed)

- Name: Barbearia do Luiz.
- Address: Rua dos Geólogos, 698 — Alípio de Melo, Belo Horizonte — MG.
- Hours: Monday–Friday 09:00–20:00, Saturday 09:00–18:00, Sunday closed.
- Contact details are seed placeholders and must be replaced with the real shop data before production.

## 7. Booking and slot rules

- Slot grid: 15 minutes.
- Service duration: 10–90 minutes. A service may cross grid lines.
- Lead time: 30 minutes.
- Horizon: 60 days.
- Slots come from shop hours for the local weekday.
- Remove slots overlapping active appointments (`pending`, `confirmed`).
- Remove slots overlapping recurring or one-off time blocks.
- Overlap: `candidateStart < existingEnd && candidateEnd > existingStart`.
- No “any barber” selection.
- Availability is computed server-side. The client never decides.
- A slot is reserved only when an order is created. Cart selection does not hold it.
- The order transaction revalidates every line, then inserts appointments under a database exclusion constraint.
- Two services in the same order for the same barber may not overlap.
- Back-to-back services are allowed.

### Time blocks

- Fields: barber, label, recurring flag, weekday (recurring), date (one-off), start, end, active.
- Recurring blocks apply every matching weekday.
- Barbers manage their own blocks. Owner manages any.
- Figma seed: daily lunch 12:00–13:30, Monday–Saturday; one chair-maintenance block.

## 8. Orders, payments, and stock

### Order model

- One order = one code, one customer context, zero or more appointments, zero or more product lines.
- Order code: `BL-` plus five digits, unique. Displayed with a leading `#`, for example `#BL-8472`.
- Product-only orders are valid.
- Order statuses: `pending_payment`, `open`, `paid`, `partially_refunded`, `refunded`, `canceled`, `expired`.

### Checkout transaction

1. Validate customer identity and guest fields.
2. Validate every service line against availability.
3. Validate product stock.
4. Create order and appointment lines as `pending`.
5. Reserve stock for product lines.
6. Online order: status `pending_payment`, expires in 15 minutes, create Mercado Pago preference.
7. On-site order: status `open`; appointments remain `pending`; no stock because products force online.

### Payment outcomes

- Webhook `paid`: order `paid`, every appointment `confirmed`, stock decremented, receipt ready, notifications sent.
- Webhook failure or expiry: order `expired`, appointments `canceled`, stock released, loyalty credit restored.
- At-chair payment: recorded per appointment on completion. Appointment `completed`; payment `paid`; order `paid` when all lines are collected.
- Refund: per line. Service line refundable if canceled more than 2h before. Product refundable before pickup. Partial refunds allowed.
- Revenue counts collected payments only.

### Stock

- Integer stock, never negative.
- Reserve at order creation, decrement on paid, release on expiry/cancel.
- Restock on product refund before pickup.
- Admin sees exact counts. Customers see “Em estoque” or “Esgotado”.
- Inventory movements are logged: reserve, release, sale, refund, adjustment.

## 9. Loyalty

- One stamp per completed service appointment.
- Products earn no stamps.
- 15 stamps → one free service credit.
- One active credit at a time. No stacking.
- If 15 stamps are reached while a credit is active, stamps hold at 15 until the credit is used.
- Credit expires in 90 days.
- Credit applies to one service line at checkout; it covers the line price.
- A canceled or expired order restores the credit.
- Tiers by lifetime completed visits: Bronze 0–9, Gold 10–19, Platinum 20+.
- Lifetime visits never decrease.
- Owner adjustments are recorded as loyalty entries.

## 10. Reviews

- Prompt after appointment `completed`.
- One review per appointment.
- Rating 1–5, optional private comment.
- Public display: average and count on barber cards.
- Owner sees comments in client/barber detail.
- No public free-text reviews in v1.

## 11. Favorites

- Favorite barbers, services, products.
- Toggle from detail/cards.
- Favoritos screen groups the three kinds.
- Product favorites show “Comprar novamente”.
- Recommendations are static/rule-based, not AI.

## 12. Admin

### Dashboard

- Today count, estimated collected revenue today, next client, free slots.
- Weekly agenda strip.
- Block availability form and active blocks.
- Today queue with status pills.
- Owner sees all barbers; barber sees own.

### Agenda

- Filters: barber (owner only), status, date/month.
- Month calendar with day markers.
- Day list and summary counts.
- Next appointment card.
- New appointment action.
- Time block management.

### Clients

- Owner: all customers. Barber: customers with appointments with them.
- Search by name or WhatsApp.
- Status filter; sort by visits.
- Table: client, WhatsApp, email, visits, last appointment, status, actions.
- Detail: total visits, total spent, favorite service, favorite barber, contact, no-show count, block state.
- Owner can unblock a no-show customer.

### Services and products

- Owner only.
- Service cards with price, duration, description, active toggle.
- Add/edit service.
- Product inventory with stock and price.
- Add/edit product and adjust stock.

### Finance

- Owner only.
- Monthly revenue, weekly revenue, average ticket, total services.
- Monthly revenue bar chart.
- Popular services.
- Revenue by barber.
- Recent payments with method badges: PIX, Cartão, Dinheiro.
- Export report (CSV or PDF) — should-have.

### Settings

- Owner only.
- Business data: commercial name, CNPJ, address, phone, WhatsApp, email.
- Opening hours per weekday.
- Team: list barbers, add/edit, activate/deactivate.
- Notifications: WhatsApp reminder, email confirmation, SMS off/hidden.
- Integrations: Google Calendar (link only), Instagram (link only), WhatsApp Business API status.
- Payments: PIX, credit, debit, cash. Show Mercado Pago, not Cielo.

## 13. Notifications

- **WhatsApp:** booking confirmation, 24h reminder, cancellation, reschedule, no-show block.
- **Email:** booking confirmation, 24h reminder, cancellation, reschedule, receipt link, verification, password reset.
- **Calendar:** ICS attachment plus Google Calendar link. No OAuth sync.
- **SMS:** not implemented; hidden.
- **Instagram:** profile link only; no API.
- Reminder cron runs hourly and sends for appointments 23–25 hours ahead, once.
- Every send is logged. Provider failures do not roll back a booking.
- Provider factories use console adapters in development.

## 14. Demo mode

- `DEMO_MODE=true` enables one-click logins for owner, barber, and customer.
- Requires a seeded PostgreSQL database. No mock data layer.
- Seed includes shop, 9 services, 3 barbers, 4 products, customers, appointments across the week, ratings, loyalty stamps, paid orders, walk-in example.
- Seed dates are relative to today, not fixed to December 2026.
- Demo endpoints are disabled when `NODE_ENV=production`.

## 15. Non-functional

- PT-BR only. BRL formatted with `Intl.NumberFormat('pt-BR')`.
- All money stored in integer cents.
- All timestamps stored in UTC, rendered in `America/Sao_Paulo`.
- Accessible baseline: contrast, keyboard reachability, focus rings, labels, `aria-label` on charts and slot picker.
- No PII or secrets in logs.
- Webhooks validate signatures and are idempotent.
- Rate limit auth and checkout.
- GTM loads only after analytics consent; no personal data is pushed to the data layer.
- Sentry reports through a same-origin tunnel, with user info, cookies, bodies, query params, and local variables disabled; replay masks text and media.
- App works at 390px and 1440px.
- Charts have text alternatives.
- No AI, no LLM calls, no model dependency.

## 16. Out of scope (v1)

Multi-shop, multi-location, marketplace, franchise, delivery, shipping, address validation, online product tracking, SMS, push, 2FA, uploads, Google Calendar OAuth sync, Instagram API, payroll, commissions, NF-e, subscriptions, deposits, coupons, waitlist, recommendations by model, English, multi-currency, light mode.

## 17. Acceptance criteria

1. Customer books one service, pays online, receives WhatsApp + email, and sees the appointment in the barber queue as `confirmed`.
2. Customer books two services with different barbers and times in one checkout; both appear as separate appointments under one order.
3. Customer adds a product to the cart; pay-at-chair is disabled; checkout requires online payment; stock decrements after payment.
4. Pay-at-chair service order stays `pending` until the barber confirms; completion records payment and adds one stamp.
5. Double-book returns a conflict. Canceled slot becomes bookable again.
6. Product stock never goes negative; unpaid order expiry releases stock and slots.
7. 15 completed services issue one credit; using it discounts one service line; canceled order restores it.
8. Three no-shows block online booking; owner unblocks and the counter resets.
9. Barber login sees only own agenda, clients, and counts. Owner sees all.
10. Finance shows collected money only; pending, canceled, and no-show do not count.
11. Demo mode logs in as owner, barber, or customer and shows seeded data.
12. No `Clip` reference remains in UI copy.
