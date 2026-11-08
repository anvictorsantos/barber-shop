# ADR 0011 — Order confirmation links carry an access token

- Status: accepted
- Date: 2026-11-08

## Context

`/pedido/[code]` rendered order details to anyone with a 5-digit code. The space is about 90,000
values, so an unauthenticated client enumerated most orders in roughly two minutes. The page is sent
to guests over WhatsApp and email, so requiring an account would break the shipped guest checkout.

## Decision

`Order.publicToken` holds 32 random bytes (base64url). Anonymous access requires the token in the
URL; a session for the owning customer, the assigned barber, or the owner bypasses it. The short code
stays for display and support.

## Consequences

- Every generated link must carry `?t=`. The four builders are the notification dispatcher, the
  Mercado Pago callback, the post-checkout redirect, and the confirmation email.
- Links are bearer tokens: anyone who receives the forwarded message can open the order. That is
  acceptable because the link is the delivery channel, and the page still excludes direct
  identifiers.
- No rate limiter is needed on the route; the token space is not enumerable.
- The token is stored in plaintext. It is not a password and is never used to authenticate anything
  else.

## Alternatives considered

- **Session-only access** — breaks guest confirmation links.
- **Longer order code** — the code is printed in the UI and read aloud; length hurts support.
- **Redeem-once token** — conflicts with reopening the confirmation page.
