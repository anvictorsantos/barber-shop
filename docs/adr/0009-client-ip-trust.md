# ADR 0009 — Client IP comes from a Cloudflare-set header plus an origin secret

- Status: accepted
- Date: 2026-11-08

## Context

Rate limiting was keyed on the first value of `X-Forwarded-For`, which the client controls. The
assessment bypassed every limiter by rotating that header.

The app sits behind Cloudflare and Render. Cloudflare appends the real client IP to
`X-Forwarded-For`; Render appends the peer it saw, which is a Cloudflare edge IP. So the leftmost
value is attacker-supplied and the rightmost value is shared by all users. Neither end is usable.
The Render origin is also reachable directly, so trusting `CF-Connecting-IP` alone would let an
attacker forge it.

## Decision

A Cloudflare Transform Rule overwrites `X-Client-IP` with `ip.src` and adds a static
`X-Origin-Secret`. The app trusts `X-Client-IP` only when `X-Origin-Secret` matches
`ORIGIN_SHARED_SECRET`. Without the secret it falls back to the rightmost `X-Forwarded-For` value.

## Consequences

- Per-IP limiting works again, including requests that bypassed Cloudflare only if they also know
  the secret.
- The secret lives in Cloudflare and in Render env; rotating it is a two-place change.
- Local development and Render health checks have no secret and use the fallback.
- The assumption about the header chain is verified from production once, then the debug endpoint is
  removed.

## Alternatives considered

- **Trust `CF-Connecting-IP` plainly** — spoofable through the public Render hostname.
- **Trust the rightmost `X-Forwarded-For`** — every user shares a Cloudflare edge IP and one bucket.
- **Trust the leftmost `X-Forwarded-For`** — the original defect.
