# ADR 0007 — Reject disposable email domains with Disify

- Status: accepted
- Date: 2026-11-01
- Source: `personal/pacepilot/docs/adr/0001-disposable-email-domains.md`

## Context

Email is one of two account identifiers. A disposable mailbox lets someone create fake accounts and abandon bookings with a fresh address each time. The address arrives at `POST /api/auth/register` and is validated for shape only.

A maintained in-repo blocklist was rejected in `pacepilot`: it rots, and every new provider needs a deploy. Two third-party lookups were measured there: Kickbox missed a known disposable domain, Disify caught it.

## Decision

Registration asks Disify whether the email domain is disposable and rejects a positive answer with `400 { code: 'email_not_allowed' }`.

- Only the domain leaves the server. The probe address is `probe@<domain>`.
- The check covers registration only. Login, verification resend, and password reset stay open, so an existing account is never locked out.
- `EmailReputationChecker` is a domain port; the Disify adapter is infrastructure. No npm dependency: Node global `fetch`.
- Fail open: timeout (2.5 s), 429, 5xx, malformed payload, or network error logs a warning and registration proceeds.
- 24-hour in-memory cache per domain, max 1,000 entries, oldest evicted. Failures are not cached.

## Consequences

- A third party must not be able to stop signups.
- False positives are user-visible; a legitimate small domain can be rejected without manual override. If this becomes real, add a reviewed allowlist before the lookup, not a general blocklist.
- The cache is per process; multiple instances spend their own quota.
- The third party receives the domain, a synthetic local part, and the egress IP. No identity, password, or account link is sent.
- Same behavior as `pacepilot`, so the implementation can be copied with minimal changes.
