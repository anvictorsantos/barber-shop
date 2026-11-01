# ADR 0003 — Multi-line orders

- Status: accepted
- Date: 2026-11-01

## Context

The Figma checkout is a cart with “Adicionar mais itens”. A customer may book more than one service in one checkout, and the shop also sells products. Each service needs its own barber, date, and time. The product decision was explicit: many services per checkout, full product commerce.

A naive model of one appointment per checkout cannot represent this without duplicating payment and customer data.

## Decision

`Order` is the checkout aggregate.

- One order contains zero or more `Appointment` lines and zero or more `OrderProduct` lines.
- Each appointment line has its own barber, start, end, service, price snapshot, and status.
- Product-only orders are allowed.
- One online payment covers the whole order.
- Pay-at-chair is allowed only when every line is a service.
- Partial refunds are recorded per line against the order payment.
- An appointment always belongs to an order, including walk-ins.

## Consequences

- Slot validation runs for every line in one transaction.
- The order state machine must handle mixed lifecycles: one line completed, another still pending, a product refunded.
- Receipts are generated per collected payment, not only per order.
- Finance must sum payments and refunds, not order totals.
- The UI gains a cart summary and line-level edit/remove that the Figma frames only hint at.
- Testing must cover multi-line conflicts, partial refunds, and partial completion.

## Alternatives considered

- **One appointment per order** — simpler, but contradicts the chosen checkout.
- **Separate service and product carts** — clearer payments, but worse customer experience and two checkouts.
- **All services same barber, back-to-back** — simpler slots, but blocks the natural “two services with two barbers” case.
