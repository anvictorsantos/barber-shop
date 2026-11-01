# ADR 0002 — Phone or email identity with password sessions

- Status: accepted
- Date: 2026-11-01

## Context

Customers must be able to sign up and log in with a phone number from any country or with an email address. The shop wants both WhatsApp and email notifications, but a customer may provide only one identifier at signup. Guest checkout must stay low-friction. The app needs three roles and revocable sessions.

## Decision

An account has an optional unique phone (E.164) and an optional unique email, plus a password. At least one identifier is required.

- Login: identifier (phone or email) + password.
- Phone signup: WhatsApp OTP, 6 digits, 10-minute TTL, 5 attempts.
- Email signup: Resend verification link, 24-hour TTL, non-blocking.
- Password reset: email link (30 minutes) or WhatsApp OTP for phone-only accounts.
- Sessions: opaque 32-byte token, SHA-256 hash stored in `sessions`, httpOnly/Secure/SameSite=Lax cookie, 30-day sliding expiry.
- Passwords: Argon2id.
- Guest checkout creates a user with `passwordHash = null`; activation link sets a password.

Disposable email domains are rejected at registration by the rule in ADR 0007.

## Consequences

- No passwordless login. Every account eventually has a password.
- Phone signup depends on WhatsApp deliverability; an email-only path remains available.
- Sessions are server-revocable and do not expose claims to the client.
- Guest accounts can exist in a half-activated state; UI must show and resend activation.
- Custom auth code must be tested carefully: hashing, rotation, expiry, rate limits, and CSRF/origin checks.

## Alternatives considered

- **Auth.js v5 credentials** — less control over phone OTP and mixed identifiers.
- **Clerk/Auth0** — fast, but a vendor dependency and cost for a single shop.
- **Passwordless OTP/magic link every login** — more messages, more provider cost, worse for repeat customers.
