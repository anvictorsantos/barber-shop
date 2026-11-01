# BRIEF — Barbearia do Luiz

> One page. Why this exists, who it is for, what success looks like. Single shop. No Clip. No multi-tenant.

## Problem

The shop runs on WhatsApp, Instagram DMs, and a paper agenda. Customers cannot see real availability, pick a barber, or pay ahead. Staff cannot see the day, the queue, stock, or what the shop actually collected. Loyal customers have no record, no stamps, and no reason to rebook in one tap. Generic calendars do not model `service duration × barber × slot × stock × payment`.

## Audience

- **Owner — Luiz.** Runs the shop, cuts hair, manages services, products, team, hours, money, and settings. Sees everything.
- **Barbers — Hinner and Carlos.** See their own agenda, clients, and appointments. Confirm, complete, reschedule, mark no-shows, block their own time.
- **Customers.** Book one or many services, buy products for pickup, pay online or at the chair, track loyalty, rate visits, save favorites.
- **Context.** One neighborhood shop in Belo Horizonte. PT-BR. BRL. Local time `America/Sao_Paulo`. Walk-ins and online bookings share one queue.

## Solution

A single web app for the shop:

1. **Book** — service catalog → service detail → barber → date/time → summary → cart with optional products → checkout → confirmation.
2. **Queue** — every appointment is one ledger row with barber, service, slot, price, status, and payment.
3. **Shop** — products with stock, pickup only, prepaid.
4. **Money** — PIX and card online through Mercado Pago; cash/card/PIX at the chair for service-only orders; receipts as PDF.
5. **Retention** — stamps, tiers, reviews, favorites, repeat booking.
6. **Operations** — dashboard, agenda, clients, services, products, finance, settings, manual bookings, time blocks.

No AI. The engine is deterministic.

## Goals

1. A customer can book `service + barber + slot` in under 30 seconds, and can add more services or products to the same checkout.
2. Every appointment has `service + barber + slot + status + payment`, so the barber always knows who is next and the owner always knows what was collected.
3. No double-booked slot, no oversold product, no invented revenue.
4. Every paid order sends WhatsApp and email confirmations, a calendar file, and a 24-hour reminder.
5. Loyalty, reviews, and favorites work from the same appointment ledger — no separate data entry.

## Success metrics (MVP)

- Booking flow works end to end for one service and for multiple services with different barbers and times.
- Double-book attempt returns a conflict; the slot picker never shows a blocked slot as available.
- Product stock never goes negative; expired unpaid orders release stock and slots.
- Online payment webhook is idempotent; paid orders confirm every appointment line; refunds are recorded.
- A completed appointment earns exactly one stamp; 15 stamps issue exactly one credit; credit is consumed once.
- Dashboards show collected revenue, not bookings.
- Demo mode renders the full app with seeded data and one-click logins.

## Non-goals (v1)

- Multi-shop, franchise, marketplace, or discovery.
- AI, recommendations by model, chat booking.
- Delivery, shipping, Correios, address-based checkout.
- SMS, push, 2FA, file uploads, Google Calendar OAuth sync, Instagram API.
- Payroll, commissions, NF-e, subscriptions, deposits, coupons, waitlist.
- English or multi-currency.
- Light mode.

## Constraints

- **Stack:** Next.js App Router + TypeScript + Prisma + PostgreSQL. Tailwind. Lucide icons. Recharts.
- **Hosting:** local-first, deploy-ready on Render + Neon Postgres. Render web service for the app, Render Cron for reminders and hold expiry, public webhooks for Mercado Pago and WhatsApp.
- **Observability:** Google Tag Manager gated by consent; Sentry through a same-origin tunnel.
- **Data:** single shop. Money in integer cents. Timestamps in UTC, displayed in `America/Sao_Paulo`.
- **Auth:** phone (E.164, any country) or email, plus password. WhatsApp OTP for phone, Resend link for email. Disposable email domains rejected.
- **Secrets:** `.env` never committed. Demo mode is forbidden in production.
- **Payments:** Mercado Pago for online PIX/card. Cash/card/PIX at chair for service-only orders.
- **Notifications:** Meta WhatsApp Cloud API and Resend. No SMS.
- **Scope:** 19 Figma screens plus a store screen and auth screens. Figma is the visual contract.

## Decisions at a glance

| Decision | Choice |
|---|---|
| Brand | Barbearia do Luiz |
| Roles | owner, barber, customer |
| Scope source | Figma screens + this docs set |
| Stack | Next.js + Prisma + PostgreSQL |
| Auth | phone or email + password; OTP/link verification |
| Demo | seeded Postgres + one-click logins |
| Orders | one order, many appointments, many product lines |
| Payment | Mercado Pago online; pay at chair for services only |
| Pickup | shop only |
| Loyalty | 15 stamps = one free service; Bronze/Gold/Platinum |
| Reviews | stars + private comment |
| No-show | 3 no-shows block online booking; owner unblocks |
| Notifications | WhatsApp + email; ICS/Google link |
| AI | none |
