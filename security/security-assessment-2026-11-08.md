# Security Assessment — Barbearia do Luiz

**Date:** 2026-11-08
**Targets:** production `https://barbeariadoluiz.com.br/` (apex; `www` redirects to it), `http://localhost:3000/` (existing local build), `http://localhost:3001/` (isolated staging)
**Assessment type:** Authorized; production non-destructive; destructive and abuse tests on isolated staging
**Scope record:** `security/scope.json`
**Outcome:** 1 Critical, 3 High, 5 Medium, 9 Low/hardening (production assessment + isolated staging validation)

---

## Production target confirmation

The primary target was `https://barbeariadoluiz.com.br/`, not staging. Confirmed again on
2026-11-08 14:11 UTC:

- `GET /` → `200`, Cloudflare, HSTS present.
- `GET /api/health` → `200`.
- `POST /api/auth/login` with the seeded OWNER password → `200` (F-01 still open).
- `GET /admin` and `GET /admin/clientes` with that session → `200`.
- `POST /api/auth/logout` → `204` (session revoked).

Earlier production checks covered headers and TLS, role guards, ICS and receipt authorization, the
public order page, cron authentication, demo mode, and login timing. Production log: Appendix A.

Not run on production: DoS, load testing, brute force, credential stuffing, mass extraction,
destructive changes, social engineering, third-party testing. Those ran on isolated staging where
bounded and safe. Staging is an addition, not a substitute.

---

## Executive summary

The production site accepts the **seeded demo password `demo1234` for the production OWNER account**
(`luiz@barbeariadoluiz.com.br`). The password is also published in the public GitHub repository
(`README.md:60`, `prisma/seed.ts:14`, `prisma/create-test-users.ts:5`, `tests/e2e/*`).
A single unauthenticated login request returns an OWNER session with access to customer PII,
financial reports, catalog, staff, and settings.

Everything else in the application is in reasonable shape: authorization on bookings and receipts
is enforced per role and per owner, admin routes are guarded, sessions use opaque hashed tokens with
`Secure`/`HttpOnly`/`SameSite=Lax`, passwords use Argon2id, cron and payment webhooks are authenticated,
and SQL is parameterized through Prisma.

The second most important issue is that **rate limiting trusts the client-supplied
`X-Forwarded-For` header**, so every limiter (login, register, password reset, OTP, checkout,
availability) can be bypassed by rotating a header value. That turns the 6-digit OTP flow into a
brute-force path and allows unlimited messaging/email abuse.

A separate isolated staging run (local Postgres + app copy, synthetic data) found a **refund race**:
five concurrent refunds of R$ 30 against a R$ 100 payment all succeeded and produced R$ 150 in refund
rows while the payment recorded only R$ 30–60 refunded. Stock, loyalty-credit, cancellation, and
completion races held correctly; token reuse and session revocation also held.

A production-like clone (production build, 5,022 orders, synthetic data at `localhost:3001`) then
reproduced the refund, no-show, and stock-error findings; cracked a weak password in under a second
through the `X-Forwarded-For` bypass; and enumerated the full 90,000-code order space in about two
minutes. Production itself was not used for these tests.

### Fix order

| Priority | Finding | Effort |
| --- | --- | --- |
| P0 | Rotate all seeded production passwords / remove demo accounts | 15 min |
| P1 | Trust proxy IP correctly + per-account lockout | 45–90 min |
| P1 | OTP issuance and attempt limits per account/phone | 2–3 h |
| P1 | Fix concurrent refund lost update (double refund) | 1–2 h |
| P2 | Fix open redirect (`next=/\evil.com`) | 10 min |
| P2 | Stop public enumeration of 5-digit order codes | 2–4 h |
| P2 | Remove account/contact enumeration | 1–2 h |
| P2 | Fix no-show race + race error mapping | 45 min |
| P3 | MFA for OWNER/BARBER | 1–2 days |
| P3 | Hardening bundle (sessions, CSP, headers, webhook, deps) | ~half day |

---

## Scope and rules of engagement

- **In scope:** `barbeariadoluiz.com.br`, `www.barbeariadoluiz.com.br`, `localhost:3000`, and the
  isolated staging instance on `localhost:3001`.
- **Staging:** a disposable copy of the current working tree with a separate Docker Postgres on
  `localhost:5433` (project `barber-staging`) and its own seed. It never shared data or secrets with
  production. The tests that production forbids (bounded brute force, light load, destructive
  changes, races, token reuse, workflow skipping) ran there only.
- **Out of scope:** Mercado Pago, Resend, WhatsApp/Meta, Neon, Sentry, Google Analytics/GTM, Disify,
  Cloudflare/Render infrastructure. On production: no DoS, load testing, brute force, credential
  stuffing, mass extraction, destructive changes, or social engineering. Staging allowed bounded
  versions of brute force, light load, destructive changes, and races; those ran there only.
- **Accounts used:** seeded test accounts (`joao.silva@example.com`, `felipe.andrade@example.com`,
  `hinner@barbeariadoluiz.com.br`, `luiz@barbeariadoluiz.com.br`).
- **Data handling:** no session tokens, cookies, or customer PII are reproduced here. Evidence is
  status codes, headers, timings, and redacted request shapes.
- **Production writes:** only session creation and logout. No business data was created, modified,
  or deleted. All sessions opened during the assessment were revoked with `POST /api/auth/logout`.
- **Local note:** the running `next-server` on port 3000 started 2026-11-07 16:50 and is stale
  relative to the current working tree. Static findings were verified against the current source;
  live local checks were used only where the deployed logic is unchanged.

---

## Findings

### F-01 — Critical: default seeded password is valid on the production OWNER account

**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` → **9.8**

**What.** Production authenticates the seed password for all seeded accounts, including OWNER.
The password is committed to a public repository and repeated in README and E2E tests.

**Evidence.**

```
POST https://barbeariadoluiz.com.br/api/auth/login
{"identifier":"luiz@barbeariadoluiz.com.br","password":"demo1234"}
→ 200, role=OWNER, Set-Cookie: bl_session=<redacted>; Secure; HttpOnly; SameSite=lax

GET /admin                     (owner cookie) → 200
GET /admin/clientes            (owner cookie) → 200   (customer list; not reproduced)
GET /admin/configuracoes       (owner cookie) → 200
```

Same result for `hinner@barbeariadoluiz.com.br` (BARBER) and the seeded customer accounts.
Public references: `README.md:60`, `prisma/seed.ts:14`, `prisma/create-test-users.ts:5`,
`tests/e2e/accessibility.spec.ts:26,46`, plus other E2E files.

**Impact.** Unauthenticated attacker becomes OWNER. That includes customer records (names, emails,
phones, CPF, addresses), financial reports and refunds, price/catalog changes, staff and schedule
changes, and customer blocking. Because the repository is public, discovery requires no guessing.

**Fix.**

1. Change the password of every seeded account in production now (OWNER first), then BARBER and
   test customers.
2. Delete or disable the demo/test accounts in production.
3. Invalidate sessions created before the rotation (the password reset path already calls
   `revokeAllSessions`; see `lib/auth/service.ts:324-328`).
4. Remove the demo password from the public README and from committed seed/test files, or move it to
   a non-production seed that cannot run when `NODE_ENV=production`.
5. Add MFA for OWNER/BARBER (F-07).

**Retest.** Login with the old password must return `401` for every seeded account.

---

### F-02 — High: rate limiting can be bypassed by spoofing `X-Forwarded-For`

**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L` → **6.5** (enables F-03 and F-06)

**What.** `clientIp()` takes the first value of `X-Forwarded-For`, which is fully client-controlled
behind Cloudflare/Render. Every limiter is keyed on that value.

`lib/http/request.ts:1-4`:

```ts
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}
```

**Evidence (localhost, same limiter code).**

```
11 login attempts, same XFF, same identifier:
  401,401,401,401,401,401,401,401,401,401,429

11 login attempts, rotating XFF, same identifier:
  401,401,401,401,401,401,401,401,401,401,401
```

**Impact.** Unlimited password guessing, OTP guessing, password-reset and verification email
bombing, WhatsApp message flooding, checkout/order spam, availability scraping. Also corrupts the
`ip` recorded on sessions and any future audit log.

**Fix.**

- Trust only headers set by your edge/proxy, not the first client-supplied value. Cloudflare sets
  `CF-Connecting-IP`; Render appends the real peer to the right of `X-Forwarded-For`.
- Add per-account counters in addition to per-IP counters (login failures, reset requests, OTP
  issuance).
- Move counters to a shared store (Redis/Upstash, or a small Postgres table) so they survive
  restarts and multiple instances. The current map is per process and resets on deploy
  (`lib/auth/rate-limit.ts:12-13`).
- Add progressive lockout/backoff for repeated failures on the same account.

**Retest.** A fixed XFF and a rotating XFF must produce the same 429 at the same threshold.

---

### F-03 — High: OTP brute force and messaging abuse

**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` → **7.5** (practical cost noted below)

**What.** Password reset by phone uses a 6-digit code. Each code allows 5 attempts, but issuing a
new code resets the attempt counter, and issuance is limited only by the bypassable per-IP limiter
(F-02).

`lib/auth/tokens.ts:6,12-14` — 10-minute TTL, 6 digits, 5 attempts.
`lib/auth/verification.ts:152-201` — new code marks previous codes consumed and starts `attempts=0`.
`app/api/auth/reset-password/route.ts:14` and `app/api/auth/verify-phone/route.ts:17` — limits keyed
on client IP (and, for verify-phone, phone).

**Impact.** With unlimited issuance, an attacker can request a new code, spend 5 guesses, repeat.
Expected ~200,000 code issuances for a 6-digit space at 5 guesses per code. Each issuance sends a
WhatsApp message, so the attack is noisy and costs the shop money, but it is not rate-limited
server-side. A successful guess resets the password and takes over the account.

**Fix.**

- Cap issuance per phone/account: e.g. 3 per hour, 10 per day, with a cooldown between sends.
- Keep a per-account failed-verification counter that is **not** reset by issuing a new code; lock
  the reset flow after 5–10 total failures for at least 1 hour.
- Bind the OTP to the purpose at verification time and consume all sibling tokens on failure limit.
- Consider 8 digits and/or email + phone confirmation for password reset.
- Alert on abnormal OTP volume per phone.

**Retest.** After the per-account limit is reached, `request-password-reset` returns 429 and no new
message is sent.

---

### F-04 — Medium: open redirect after login via a backslash in `next`

**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N` → **6.1**

**What.** `safeNextPath` rejects `//` but accepts a backslash. Browsers normalize `\` to `/`, so
`/\evil.com` resolves to `https://evil.com/`. After a successful login the client calls
`router.push(postAuthPath(...))`, which navigates off-site.

`lib/auth/redirect.ts:3-7`:

```ts
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
```

`components/auth/LoginForm.tsx:77` — `router.push(postAuthPath(result.data.user.role, next))`.

**Evidence.** Local Playwright, fresh browser, external requests intercepted and aborted:

```
URL:    http://localhost:3000/entrar?next=%2F%5Cevil.com
After login as a seeded customer:
  attempted request → http://evil.com/?_rsc=...
  attempted navigation → http://evil.com/
```

Production uses the same helper and the same `router.push` call; the production page renders the
same login flow. The production browser test was blocked by edge bot protection, so the live proof
is on localhost plus source review.

**Impact.** A convincing post-login phishing redirect. It does not expose the session cookie
(`HttpOnly`, `SameSite=Lax`) but it can move a just-authenticated user to an attacker-controlled
page.

**Fix.**

```ts
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  if (value.includes('\\') || /[\u0000-\u001f]/.test(value)) return null
  try {
    const url = new URL(value, 'https://placeholder.invalid')
    if (url.origin !== 'https://placeholder.invalid') return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}
```

**Retest.** `?next=%2F%5Cevil.com` must leave the browser on the site after login.

---

### F-05 — Medium: public order-confirmation page indexed by a 5-digit code

**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N` → **5.3**

**What.** `/pedido/[code]` renders order details with no authentication or ownership check. The
order code is `BL-` plus a random 5-digit number, so the space is ~90,000 values.

`lib/orders/code.ts:8` — `BL-${randomInt(10000, 100000)}`.
`app/pedido/[code]/page.tsx:43-45` — `getOrderByCode(code)`; `notFound()` only when missing.

**Evidence.**

```
GET /pedido/BL-1022   (anonymous) → 200
GET /pedido/BL-99999  (anonymous) → 404
GET /pedido/BL-1022   contains: order code, service name, barber, date/time, total
                      does not contain: customer name, email, phone, payment IDs
```

**Impact.** An unauthenticated attacker can enumerate most orders in a few hours and learn who is
booked, for which service and barber, when, and how much they are spending. It also confirms order
existence. LGPD-relevant personal data, even without direct identifiers. On the production-like
clone, 2,000 random probes produced 125 hits at 642 req/s; the full 90,000-code space takes about
two minutes from one machine.

**Fix (choose one).**

- Add an unguessable `publicToken` (32 random bytes) to `Order`; require `/pedido/[code]?t=<token>`
  for anonymous access. Keep the short code for display.
- Or require an authenticated session and enforce ownership (customer, assigned barber, or OWNER)
  inside the page.
- Rate-limit `/pedido/*` and return 404 for unauthorized access.

**Retest.** Anonymous access with a code alone must return 404/403; the signed link must still work.

---

### F-06 — Medium: account and contact enumeration

**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N` → **5.3**

**What.** Three independent oracles reveal whether an email/phone has an account:

1. `POST /api/auth/register` returns `409 identifier_taken` for an existing contact
   (`lib/auth/service.ts:111-114`).
2. Login timing: unknown accounts skip Argon2 verification
   (`lib/auth/service.ts:187-195`).
3. Password-reset timing: delivery is awaited only for existing accounts
   (`lib/auth/service.ts:247-264`).

**Evidence (production, 3 samples each).**

```
login, existing account, wrong password:  474 ms, 516 ms, 811 ms (median 516)
login, missing account:                   281 ms, 290 ms, 293 ms (median 290)
```

**Impact.** Build a list of customers, staff, and valid contacts. Feeds phishing, credential
stuffing, and the OTP attack in F-03.

**Fix.**

- Registration: return a generic `202` and send an "account already exists / sign in" email instead
  of `409`.
- Login: when the user is absent, verify against a fixed dummy Argon2 hash so both paths cost the
  same.
- Password reset: perform the same work and return `202` regardless; move delivery off the response
  path (`after()`/queue) and add jitter.
- Add CAPTCHA or proof-of-work to register/reset if abuse persists.

**Retest.** Timing medians converge and registration no longer differs for existing contacts.

---

### F-07 — Medium: no MFA and no lockout on privileged accounts

**CVSS 3.1:** `AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` → **6.5** (weakness; exploitability depends on
credential compromise)

**What.** OWNER and BARBER accounts authenticate with a password only. There is no second factor,
no device approval, and no account lockout. Combined with F-01, the owner account has a single
public secret.

**Fix.** TOTP or passkeys for OWNER/BARBER; step-up authentication for refunds, settings, staff
changes, and customer blocking; lockout/backoff per account.

**Retest.** Owner login without a second factor is rejected once MFA is enabled.

---

### F-08 — Low: limiter state is per-process and resets on deploy

`lib/auth/rate-limit.ts:12-13` keeps buckets in a module-level `Map`. A restart clears all counters;
multiple instances do not share them.

**Fix.** Move counters to a shared store with TTLs. Keep the in-memory implementation only for tests.

---

### F-09 — Low: session lifetime and management

`lib/auth/session.ts:12` — 30-day sliding expiry, refreshed after 24 h of use, with no absolute cap.
There is no UI to list or revoke sessions, and no re-authentication for sensitive actions.

**Fix.** Absolute lifetime (e.g. 7 days for staff, 30 for customers), session list/revoke, rotate the
token on privilege change, and step-up auth for sensitive actions.

---

### F-10 — Low: same-origin check accepts requests with no `Origin`

`lib/http/origin.ts:5-6` returns early when `Origin` is absent. Modern browsers send `Origin` on
cross-site POSTs and the session cookie is `SameSite=Lax`, so this is not currently exploitable, but
it weakens the defense-in-depth story for cookie-authenticated endpoints.

**Fix.** Require `Origin` (or a same-origin `Referer`) for state-changing requests that use cookies;
keep the header-optional path only for non-browser API clients with their own auth.

---

### F-11 — Low: CSP allows inline scripts

`next.config.ts:9-13` — `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com`.
`unsafe-inline` is the main remaining XSS mitigation gap. There is no `report-uri`/`report-to`.

**Fix.** Nonce-based CSP generated per request (Next middleware + `headers()`), keep GTM allowlisted,
add a report endpoint. Verify no `dangerouslySetInnerHTML` with user data exists — current uses are
the fixed GTM snippet and escaped JSON-LD.

---

### F-12 — Low: image optimizer accepts any HTTPS image host

`next.config.ts:32-34` — `remotePatterns: [{ protocol: 'https', hostname: '**' }]`.

Observed: same-origin PNG → 200; Unsplash JPEG → 200; non-image response → 400 (content-type
validation). This is an open image proxy and a limited SSRF primitive against HTTPS endpoints that
return images.

**Fix.** Replace `**` with the exact hosts used (`images.unsplash.com`, your own host/CDN).

---

### F-13 — Low: Mercado Pago webhook assumptions

`app/api/webhooks/mercadopago/route.ts:42-56` verifies the signature only when
`MERCADO_PAGO_WEBHOOK_SECRET` is set; an empty secret silently disables verification.
`lib/payments/signature.ts` does not check `ts` freshness, so a captured signed notification can be
replayed (the settlement is idempotent by `providerPaymentId`, which limits impact).
`lib/payments/settle.ts:17-105` does not compare the provider amount to `order.totalCents`.

**Fix.** Fail closed in production when the secret is missing; reject `ts` older than ~5 minutes;
assert `amountCents >= order.totalCents` (or record an underpayment explicitly).

---

### F-14 — Low: dependency audit

`npm audit`: 3 high, 11 moderate, 0 critical.

- High: `deepmerge-ts` (via Prisma config), `prisma`/`@prisma/config` (dev/build path).
- Moderate: `@sentry/*` bundler plugins, `glob`, `minimatch`, `typescript-eslint` (dev tooling).

No vulnerable runtime request-handling path was identified. Treat as hygiene, not an incident.

**Fix.** Update Prisma, Sentry, and TypeScript-ESLint; re-run `npm audit`; add a CI audit gate for
production dependencies.

---

### F-15 — Low / hardening bundle

- `.env` is mode `644` on the workstation and contains production database and provider credentials.
  Use `chmod 600 .env` and a secret manager for production.
- Missing `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` headers.
- `x-render-origin-server: Render` discloses the hosting platform.
- `lib/payments/mercado-pago.ts:61-67` returns the Mercado Pago error body to the caller; truncate
  and log server-side instead.
- Password policy is only "8 to 128 characters" (`lib/validation/auth.ts:9-12`); add a breached-password
  check and a small denylist.
- Email verification is not required to log in; decide whether that is intended.
- No audit log for refunds, customer blocking, price changes, or role changes.
- `README.md` documents the demo password; remove it from public docs even after rotation.
- No `security.txt`; add `/.well-known/security.txt` with a contact.

---

## Staging validation (2026-11-08)

Environment: isolated copy of the current working tree at `/tmp/barber-staging-20261108`, Docker
`postgres:16-alpine` on `localhost:5433` (Compose project `barber-staging`), separate seed. The
production database and the existing `barber-ai-db-1` container were not used. Limits: 10 concurrent,
under 500 requests per test, no external hosts. Authorization is recorded in
`security/scope.json` under `staging`.

**Held correctly**

- Stock: two concurrent orders for the last unit → one success, one rejected; `stock=1`,
  `reserved=1`, one order line. No oversell.
- Loyalty credit: two concurrent orders using one credit → one success, one `credit_unavailable`;
  credit `USED` once.
- Cancellation: two concurrent cancels → one refund row (R$ 50); the second refund was rejected.
- Completion: two concurrent completes → one `STAMP` entry, `lifetimeVisits=1`.
- Email verification token: first `200`, replay `400`.
- Password reset token: first `200`, replay `400`; reset revoked the existing session (`200` → `401`).
- OTP: five wrong codes rejected; issuing a new code reset attempts, then the correct code was
  accepted. Confirms the F-03 reset behaviour.
- Origin: `Origin: https://evil.example.com` → `403`; no `Origin` → `200` (F-10).
- Method: `GET /api/auth/login` → `405`.
- Rate limit: fixed XFF → 10×401 then 429; rotating XFF → 11×401 (F-02).
- Light load (dev server, local machine): 200/200 health, p50 12 ms, p95 31 ms; 60/60 availability,
  p50 26 ms, p95 50 ms; no 5xx. HTML routes are slower in dev mode, so this is a smoke test, not a
  capacity result.

**Failed**

- Refund concurrency (F-16).
- No-show concurrency (F-17).
- Race error mapping (F-18: stock + review).

### F-16 — High: concurrent refunds lose updates and refund more than the payment

**CVSS 3.1:** `AV:N/AC:H/PR:H/UI:N/S:U/C:N/I:H/A:N` → **5.9** (business priority High: money)

**What.** `refundOrderPayment` reads `payment.refundedCents` inside the transaction, then writes
`current.refundedCents + input.amountCents`. That is a read-modify-write with no row lock and no
conditional update. Concurrent calls all read the same starting value and overwrite each other.

`lib/payments/refund.ts:80-105` — the transaction; `lib/payments/refund.ts:75-78` — the Mercado Pago
refund is issued *before* the local transaction commits.

**Evidence (staging, manual cash payment of R$ 100).**

```
five concurrent refunds of R$ 30:
  run 1: 5 ok, refund rows 5, sum 15000, payment.refundedCents 6000, status PARTIALLY_REFUNDED
  run 2: 5 ok, refund rows 5, sum 15000, payment.refundedCents 3000, status PARTIALLY_REFUNDED
  run 3: 5 ok, refund rows 5, sum 15000, payment.refundedCents 3000, status PARTIALLY_REFUNDED

sequential control (3 × R$ 40):
  ok, ok, rejected ("Valor de reembolso inválido"), rows 2, sum 8000
```

Reproduced on the production-like clone with 5,022 orders: 5/5 succeeded, 5 refund rows, sum 15000,
`refundedCents` 6000.

**Impact.** Owner/staff can issue more refunds than the payment. For manual cash/PIX refunds this is
direct financial loss. Payment and order status become wrong (`refundedCents` undercounts, order may
stay `PARTIALLY_REFUNDED`). For Mercado Pago, several provider refunds can be attempted before the
local check, and a provider refund can succeed while the local transaction later fails.

**Fix.**

- Claim the amount atomically inside the transaction:

```ts
const claimed = await tx.payment.updateMany({
  where: {
    id: payment.id,
    refundedCents: { lte: payment.amountCents - input.amountCents },
  },
  data: { refundedCents: { increment: input.amountCents } },
})

if (claimed.count === 0) {
  throw new AppError(400, 'invalid_amount', 'Valor de reembolso inválido.')
}
```

- Re-read the payment to set `PAID` / `PARTIALLY_REFUNDED` / `REFUNDED`.
- Add a database check constraint: `refunded_cents <= amount_cents`.
- Move `createMercadoPagoRefund` after the local claim. If the provider call fails, reverse the claim
  or mark the refund as failed.
- Add an idempotency key per refund action.

**Retest.** Fire 5 concurrent R$ 30 refunds on a R$ 100 payment: at most 3 succeed,
`refundRows <= 3`, `refundedCents === refundSum`.

### F-17 — Medium: concurrent no-show marks increment the counter twice

**CVSS 3.1:** `AV:N/AC:H/PR:H/UI:N/S:U/C:N/I:L/A:N` → **3.5** (business impact: unfair blocking)

**What.** `markAppointmentNoShow` checks the appointment status before the transaction, then updates
the status and increments the customer counter unconditionally inside it.

`lib/admin/appointments.ts:137-168`.

**Evidence (staging).** Customer with `noShowCount=1`; two concurrent calls on one appointment:

```
results: ["ok","ok"], status: NO_SHOW, noShowCount: 3, bookingBlocked: true
```

Reproduced on the production-like clone: same result (`noShowCount 3`, `bookingBlocked true`).

**Impact.** A double-click, retry, or two staff devices can block a customer after one no-show
instead of two. The count is inflated and the block threshold is reached early.

**Fix.** Make the state transition conditional inside the transaction, and only increment when the
transition happened:

```ts
const updated = await tx.appointment.updateMany({
  where: { id: appointment.id, status: { in: ['PENDING', 'CONFIRMED'] } },
  data: { status: 'NO_SHOW', noShowAt: new Date() },
})
if (updated.count === 0) {
  throw new AppError(409, 'invalid_status', 'Este agendamento não pode ser marcado como falta.')
}
```

Then increment `noShowCount` and evaluate the block once.

### F-18 — Low: race errors are unmapped

**What.** Two races are blocked by the database but surface raw errors instead of a clean conflict:

- Stock: the oversell guard works, but the losing transaction throws
  `PrismaClientKnownRequestError` with raw query code `40001` ("could not serialize access due to
  read/write dependencies"). `createOrder` only maps exclusion errors, so the action returns a
  generic failure instead of a 409.
- Review: concurrent reviews on the same appointment hit the unique constraint on `appointment_id`;
  the duplicate is prevented, but the caller gets a generic failure instead of `already_reviewed`.

**Evidence.** Staging and clone:

```
stock:  one ok, one raw 40001; final stock=1, reserved=1, one order line
review: one ok, one raw unique-constraint error; reviews=1
```

**Fix.** Catch `40001` / Prisma `P2034`, retry the transaction once, then return
`409 stock_unavailable` / `409 slot_taken`. Catch the review unique violation (`P2002`) and return
`409 already_reviewed`.

### Branch note

The current working tree adds `/api/auth/phone-login` and `/api/auth/activate`. Both use the same
IP-only limiter and the 6-digit OTP flow, so they inherit F-02 and F-03. Fix those before deploying
the branch. `sendAccountActivation` is queued after guest checkout with the contact supplied in the
request; it only sends to the account's own stored contact, so it does not disclose the token, but
guest orders can be used to trigger activation messages.

---

## Production-like clone validation (2026-11-08)

Purpose: run the test classes production forbids without touching production.

**Environment.** Current working tree copied to `/tmp/barber-clone-20261108`; `next build --webpack`
then `next start` (production mode, one Node process); Docker `postgres:16-alpine` on
`localhost:5433` (Compose project `barber-clone`); synthetic volume of 2,016 users, 5,022 orders,
5,022 appointments, and 5,000 unique `BL-` codes. All identities use `@example.test`; no real PII.
Production was not contacted for these tests. The clone was destroyed afterward.

### Brute force (bounded)

91 common passwords × 2 synthetic accounts, concurrency 5, rotating `X-Forwarded-For`.

```
weak account (password123):   91 attempts, 1 success (password123), 90×401, 270 ms (~337 attempts/s)
strong account (30-char):     91 attempts, 0 success
correct login after run:      200 (no lockout)
control, fixed XFF:           10×401 then 429
```

The only barrier is the IP limiter, and it is bypassable. A weak password falls immediately; the
account is not locked. Confirms F-02 and F-07.

### Load (single instance, local)

| Path | Requests | Concurrency | RPS | p50 | p95 | p99 | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/health` | 2,000 | 50 | 4,651 | 10 ms | 19 ms | 28 ms | 200/200 |
| `/` | 500 | 25 | 303 | 80 ms | 138 ms | 140 ms | 200/200 |
| `/servicos` | 200 | 10 | 424 | 23 ms | 33 ms | 34 ms | 200/200 |
| `/api/availability` | 100 | 10 | 1,754 | 5 ms | 11 ms | 14 ms | 200/200 |

No 5xx. Local Postgres and no CDN, so this is a smoke baseline, not a production capacity guarantee.

### Mass extraction

2,000 random `BL-` codes, concurrency 25:

```
125 hits, 1,875 404, 642 req/s, p50 37 ms, p95 52 ms, p99 91 ms
5,022 orders in a 90,000-code space
full space ≈ 2 minutes; all orders ≈ 2 minutes
```

A hit page contained service, barber, date/time, and total; it did not contain customer name or
email. This raises the practical priority of F-05.

### Races and destructive changes

```
refund:    5 concurrent R$30 refunds on R$100 → 5/5 ok, 5 rows, sum 15000, refundedCents 6000
no-show:   2 concurrent → noShowCount 3, bookingBlocked true
stock:     2 concurrent last-unit → one ok, one raw 40001; stock 1, reserved 1 (no oversell)
credit:    one ok, one credit_unavailable (held)
cancel:    one refund row (R$50) (held)
complete:  one STAMP entry (held)
review:    one ok, one raw unique-constraint error; DB prevents duplicates, error mapping gap
workflow:  settle expired → rejected; settle paid → rejected (held)
tamper:    extra price fields stripped; negative quantity rejected (held)
```

F-16 and F-17 reproduce on a production build. F-18 extends to the review race: the duplicate is
blocked by the database, but the caller gets a generic failure instead of a clean conflict.

---

## Coverage matrix

| Category | Tested | N/A | Not tested | Notes |
| --- | --- | --- | --- | --- |
| Access control (BOLA/BFLA) | 6 | 0 | 2 | ICS 200/403/401; receipt 200/403/401; admin pages guarded; barber scoped; every server action reviewed statically |
| Authentication | 10 | 1 | 0 | Login, reset, OTP, demo, default creds, timing, enumeration, session fixation, bounded clone brute-force; no MFA/OAuth/JWT to test |
| Session & cookies | 6 | 0 | 1 | `Secure`, `HttpOnly`, `SameSite=Lax`, fixation, logout revocation, reset revocation; no shared-cache testing |
| Injection | 4 | 3 | 2 | Prisma parameterization, XSS sinks, email escaping, JSON-LD; no XML/deserialization/command surface |
| SSRF / file handling | 2 | 1 | 2 | Image optimizer, Disify lookup; no uploads; no internal-range probing (out of scope) |
| Business logic | 9 | 1 | 0 | Server-side pricing, quantities, credit ownership, refund authz, token single-use, workflow skipping; races tested on staging and clone |
| Concurrency | 8 | 0 | 0 | Refund (failed), no-show (failed), stock (held, raw error), credit (held), cancel (held), complete (held), review (held, raw error), workflow (held) |
| Abuse / load | 5 | 0 | 1 | Rate-limit bypass, bounded brute-force, light load, production-build load, mass extraction; no DoS |
| Configuration & disclosure | 9 | 0 | 1 | Headers, TLS, CORS shape, `.env`/`.git`, source maps, error handling, robots, health; no subdomain takeover |
| Client-side | 5 | 0 | 1 | CSP, token storage (HttpOnly only), postMessage (none), GTM gating, client authz; no DOM-XSS fuzzing |
| API-specific | 7 | 1 | 1 | BOLA, auth, property-level (Zod strips), resource limits, webhooks, cron, mass extraction; no GraphQL/WebSocket |
| Infrastructure | 0 | 0 | 3 | Cloudflare/Render/Neon/Mercado Pago out of scope |

A category with untested items is not reported as "no issues found".

---

## Positive controls verified

- Passwords hashed with Argon2id (`lib/auth/password.ts`).
- Session tokens are 256-bit opaque values, stored only as HMAC hashes (`lib/auth/session.ts`).
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`.
- Session fixation prevented: login issues a new token even when a cookie is supplied.
- Logout revokes the session server-side (replay after logout → 401).
- Password reset revokes all sessions (`lib/auth/service.ts:324-328`).
- Email verification and password reset tokens are single-use; OTP verification increments attempts.
- Stock, loyalty-credit, cancellation, and completion races held under concurrent staging requests.
- Foreign `Origin` is rejected; method switching returns 405; no `Origin` is accepted (F-10).
- ICS and receipt endpoints enforce ownership and role (`app/api/agendamentos/[id]/ics/route.ts`,
  `app/api/pedidos/[code]/recibo/route.ts`).
- Admin pages and server actions call `requireStaff`/`requireOwner`; barbers are scoped to their own
  agenda, clients, and revenue.
- Cron endpoints require a constant-time `Bearer CRON_SECRET`.
- Demo mode is refused in production (`lib/env.ts:53-55`) and the demo endpoint returns 404.
- Prisma parameterization throughout; the few raw statements use tagged template parameters and
  conditional updates for stock.
- Email templates escape user-controlled values.
- CSP, HSTS with preload, `X-Content-Type-Options`, `X-Frame-Options: DENY`, permissions policy,
  referrer policy, `poweredByHeader: false`.
- TLS 1.3, valid certificate chain, HTTP→HTTPS 301, `www`→apex 301.
- No secrets committed to git; `.env` is ignored and was never committed.
- Sentry configured with `urlQueryParams: false`, cookie/header denial, masked replays.
- `package-lock.json` present; no critical dependency advisories.

---

## Appendix A — test log (production, non-destructive)

| Check | Result |
| --- | --- |
| `POST /api/auth/demo {}` | 404 demo disabled |
| `POST /api/auth/login` owner/barber/customer with seed password | 200 each (F-01) |
| `GET /admin` as customer | 307 → `/conta/agendamentos` |
| `GET /admin/configuracoes` as barber | 307 → `/admin` |
| `GET /admin/financeiro` as barber | 200, scoped to own revenue |
| `GET /admin/clientes` as owner | 200 |
| ICS: own / other customer / anonymous | 200 / 403 / 401 |
| Receipt: own / other customer / anonymous | 200 / 403 / 401 |
| `GET /pedido/BL-1022` anonymous | 200, metadata only (F-05) |
| `GET /pedido/BL-99999` anonymous | 404 |
| `GET /api/cron/*` without token | 401 |
| Session fixation with a chosen cookie | new token issued |
| Logout then replay cookie | 401 |
| Login timing, existing vs missing | 516 ms vs 290 ms median (F-06) |
| `GET /.env`, `/.git/config`, `/sitemap.xml` | 404 |
| `GET /api/health` | 200, service name + time |
| TLS | TLS 1.3, verify OK |

## Appendix B — local and staging tests

**Localhost:3000 (existing build)**

- Rate-limit bypass: 10×401 then 429 with fixed XFF; 11×401 with rotating XFF (F-02).
- Open redirect: Playwright `?next=%2F%5Cevil.com` → attempted `http://evil.com/` (F-04).
- Login matrix across all seeded roles and admin routes (used to confirm guards and scoping).
- Database reads were limited to the seeded test accounts, to obtain IDs for the authorization
  checks.

**Staging (localhost:3001, isolated database)**

- Environment: `/tmp/barber-staging-20261108`, Docker `postgres:16-alpine` on `localhost:5433`,
  Compose project `barber-staging`, separate seed (`9 services, 4 products, 3 barbers, 11 customers,
  22 appointments, 22 orders`).
- Auth: fixed XFF → 429 at the 11th request; rotating XFF → no 429. Foreign Origin → 403; missing
  Origin → 200. `GET` on a POST-only route → 405.
- Tokens: email verification first 200 / replay 400; password reset first 200 / replay 400; reset
  revoked the live session (200 → 401).
- OTP: five wrong codes rejected; new code reset the attempt counter; correct code accepted.
- Races: refund failed (F-16); no-show failed (F-17); stock held with a raw 40001 on the loser
  (F-18); credit, cancel, and complete held.
- Load: 200 health requests at concurrency 10 → 200/200, p50 12 ms, p95 31 ms; 60 availability
  requests at concurrency 10 → 60/60, p50 26 ms, p95 50 ms; no 5xx. Dev-mode HTML pages were slower
  (p95 ~3.3 s), so this is a smoke test, not a capacity result.
- Teardown: staging server stopped, Compose project and volume destroyed, temporary directory
  removed.

**Production-like clone (localhost:3001, production build)**

See `Production-like clone validation` above. Summary: bounded brute force cracked a weak synthetic
password in 270 ms with no lockout; 2,800 load requests produced no 5xx; 2,000 order-code probes at
642 req/s found 125 orders and the full space takes ~2 minutes; refund, no-show, stock, review,
credit, cancel, complete, workflow, and tamper tests reproduced the findings or held.

## Appendix C — cleanup

All production sessions created during the assessment were revoked with `POST /api/auth/logout`.
No business records were created, changed, or deleted. Failed-login probes used non-existent
identifiers except where timing comparison required a known account. The staging database and its
temporary directory were destroyed after the run; all destructive tests ran only there.

The localhost test runs created a few session rows in the shared database. Their cookie tokens were
never emitted, and the automatic deletion of those rows was refused as a production database write.
They remain until their normal expiry unless removed explicitly. They were created with the local
`SESSION_SECRET`, so they are not valid on production if that secret differs. The production-like
clone database and its temporary directory were also destroyed after the run.

## Appendix D — next review

Re-run after the P0/P1 fixes. Retest F-01 through F-06, F-16, F-17, and F-18, then spot-check the
rest. Ask for a retest of the CSP nonce work and the order-token flow once implemented.
