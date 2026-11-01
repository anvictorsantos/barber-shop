# ADR 0004 — Mercado Pago for online, pay at chair for services

- Status: accepted
- Date: 2026-11-01

## Context

Customers must pay by PIX, credit card, or at the shop. The Figma settings screen labels Cielo as the processor, but that is mock copy. Products require prepayment because they leave stock; services can be paid at the chair. The shop is in Brazil and most customers use PIX.

## Decision

- Online payments use Mercado Pago Checkout Pro: PIX, credit card, debit card.
- Pay at chair uses cash, card, or PIX, and is allowed only for service-only orders.
- Any order containing a product requires online prepayment.
- Mercado Pago sends webhooks with signature validation; processing is idempotent by `providerPaymentId`.
- Refunds are partial or total against a payment; each refund stores the provider refund id.
- Revenue is computed from collected payments minus refunds.

## Consequences

- The shop needs a Mercado Pago business account, production credentials, and a public webhook URL.
- PIX has no card data, but Mercado Pago may require payer identification for some flows; CPF is optional in the profile and requested at checkout only if the provider requires it.
- At-chair orders need per-appointment payment records; one order can accumulate several payments over different days.
- Subscription, deposits, and coupons remain out of scope.
- The Figma “Cielo” label must be replaced with “Mercado Pago”.

## Alternatives considered

- **Cielo** — Figma label, but heavier onboarding and less convenient PIX checkout.
- **Asaas** — good PIX and boleto, but boleto is out of scope and the checkout experience is weaker.
- **Stripe** — excellent cards, weaker PIX coverage for this shop.
