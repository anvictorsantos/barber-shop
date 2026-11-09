# Remediation plan — 2026-11-08

**Source:** `security/security-assessment-2026-11-08.md` (F-01 … F-18)
**Branch:** `fix/security-p0-p1`, cut from `feat/guest-booking-activation`
**Scope approved in session 2026-11-08:** plan + implementation of P0/P1 and the selected P2 items.
MFA and nonce-based CSP are deferred and recorded as accepted risks.

---

## Production actions (owner — not code)

| # | Action | Finding | Done |
| --- | --- | --- | --- |
| 1 | Reset `luiz@barbeariadoluiz.com.br` at `/recuperar-senha` | F-01 | ☐ |
| 2 | Reset or delete `hinner@barbeariadoluiz.com.br` | F-01 | ☐ |
| 3 | Rotate seeded `*@example.com` customers; delete rows with no orders | F-01 | ☐ |
| 4 | Confirm the old password returns `401` (command in the assessment) | F-01 | ☐ |

Until step 4 passes, F-01 is open and the production OWNER account has a public password.

---

## Decisions

| Area | Decision |
| --- | --- |
| Deliverable | This plan, then implementation in commit-sized steps on `fix/security-p0-p1` |
| Client IP | Cloudflare Transform Rule overwrites `X-Client-IP: ip.src` and adds a secret header; the app trusts `X-Client-IP` only when the secret matches |
| Rate-limit store | Postgres table `rate_limits`, atomic upsert; in-memory `Map` stays for unit tests |
| Order page | `Order.publicToken` required for anonymous access; session bypass for owner, assigned barber, and owning customer |
| Registration enumeration | Generic `202`; dummy Argon2 verification on unknown login; password reset always `202` |
| Refund ordering | Atomic local claim → provider refund → mark failed and reverse the claim on provider error |
| Refund double-submit | Same payment + amount + reason within 10 s is rejected |
| OTP | 6 digits; 3 issuances/h, 10/day; 5 failures → 1 h block, not reset by a new code |
| Login lockout | 5 failures / 15 min → 15 min lock, per account |
| Sessions | Absolute 7 days staff / 30 days customer; idle refresh unchanged |
| MFA | Deferred to a dedicated project (accepted risk) |
| CSP nonce | Per-request nonce + `strict-dynamic`, generated in `proxy.ts` (production only) |
| Tests | Unit for pure logic, integration (local DB) for races and tokens, no new E2E |
| ADRs | 0009 client IP, 0010 rate-limit store, 0011 order access token |

---

## Finding ledger

| Finding | Severity | Decision | Step | Status |
| --- | --- | --- | --- | --- |
| F-01 seeded password | Critical | Rotation + seed/README/E2E guard | 0/1 | open |
| F-02 XFF bypass | High | Trusted client IP + shared limiter + per-account counters | 3 | done |
| F-03 OTP brute force | High | Issuance caps + failure counter that survives reissue | 4 | done |
| F-04 open redirect | Medium | Strict same-origin path parsing | 2 | done |
| F-05 order enumeration | Medium | `publicToken` on anonymous access | 6 | done |
| F-06 enumeration oracles | Medium | Generic register, dummy hash, always-202 reset | 7 | done |
| F-07 no MFA | Medium | Deferred; lockout shipped | — | accepted risk |
| F-08 in-memory limiter | Low | Postgres store | 1 | done |
| F-09 session lifetime | Low | Absolute cap + session list/revoke UI | 8/9 | done |
| F-10 missing Origin | Low | Require `Origin` or same-origin `Referer` on cookie-authenticated writes | 8 | done |
| F-11 CSP `unsafe-inline` | Low | Per-request nonce + `strict-dynamic` in `proxy.ts` | 10 | done |
| F-12 open image proxy | Low | Exact host allowlist | 8 | done |
| F-13 webhook assumptions | Low | Fail closed, `ts` freshness, amount assert | 8 | done |
| F-14 dependencies | Low | Prisma 7 + pg adapter; CI audit gate | 8/11 | done |
| F-15 hardening bundle | Low | `.env` 600, headers (adds COOP/CORP), security.txt, password policy, audit log | 1/8/9 | done |
| F-16 refund race | High | Atomic claim + compensating failure path | 5 | done |
| F-17 no-show race | Medium | Conditional transition inside the transaction | 5 | done |
| F-18 unmapped race errors | Low | Retry once, map `P2034`/`P2002` | 5 | done |

---

## Step 0 — Production rotation (owner)

See the table at the top. Code cannot close F-01 on its own.

**Acceptance:** `POST /api/auth/login` with `demo1234` returns `401` for every seeded account.

---

## Step 1 — Hygiene and rate-limit foundation

1. `chmod 600 .env`.
2. `prisma/seed.ts`: password from `SEED_DEMO_PASSWORD`; refuse to run when `NODE_ENV=production`.
   Same guard in `prisma/create-test-users.ts`.
3. `README.md`: remove the literal password; document `SEED_DEMO_PASSWORD`.
4. E2E specs: read `E2E_PASSWORD` with no committed fallback literal.
5. Prisma model `RateLimit { key @id, count, resetAt }` + migration.
6. `lib/auth/rate-limit.ts`: async Postgres-backed `takeRateLimit` using a single atomic
   upsert; keep the in-memory implementation behind a test-only entry point.
7. `lib/http/rate-limit.ts` becomes async; update every call site to `await`.
8. `vitest.integration.config.ts`: refuse a `DATABASE_URL` whose host is not `localhost`/`127.0.0.1`.

**Acceptance:** unit tests pass; integration config throws on the Neon URL; seed refuses production;
`git grep demo1234` returns only the non-production default in one guarded place.

---

## Step 2 — Open redirect (F-04)

Replace `safeNextPath` with the strict parser from the assessment: reject `\`, control characters,
and any URL whose origin is not the placeholder origin; return `pathname + search + hash`.

**Acceptance:** unit tests for `/\evil.com`, `//evil.com`, `https://evil.com`, `/%5Cevil.com`,
valid `/conta/agendamentos?x=1`.

---

## Step 3 — Real client IP and per-account limits (F-02)

1. Cloudflare Transform Rule (owner, dashboard): overwrite `X-Client-IP` with `ip.src`, set
   `X-Origin-Secret` to a generated value; store it in Render as `ORIGIN_SHARED_SECRET`.
2. Temporary secret-gated endpoint returns the observed header chain. Read it from production,
   record the result, then delete the endpoint.
3. `clientIp`: use `X-Client-IP` only when `X-Origin-Secret` matches; otherwise fall back to the
   rightmost `X-Forwarded-For` (Render appends the peer) and `X-Real-IP`.
4. Keys: keep per-IP keys, add `login-fail:<identifier>`, `reset-request:<identifier>`,
   `otp-issue:<identifier>`, `otp-fail:<identifier>`.
5. Login: after 5 failures on one identifier, return `429` for 15 min even with a correct password.

**Acceptance:** rotating XFF hits `429` at the same threshold as a fixed XFF; the debug endpoint is
gone; production header chain matches the documented assumption.

**Observed 2026-11-09:** `X-Client-IP` was present with a matching origin secret, and the trusted IP
equalled `cf-connecting-ip`. Raw chain:
`95.95.6.142, 95.95.6.142, 162.158.110.58, 10.30.24.100`. The rightmost value is a Render-internal
address, confirming the old fallback would have collapsed buckets. The debug endpoint was removed
after this reading.

---

## Step 4 — OTP issuance and failure caps (F-03)

`lib/auth/verification.ts`:

- Before issuing a phone OTP or password-reset OTP, count tokens created for the identifier in the
  last hour and day; throw `429` at 3/h and 10/day.
- Add `otp-fail:<identifier>` that is **not** reset by issuing a new code; at 5, block reset for 1 h.
- Keep `OTP_MAX_ATTEMPTS` per code as the second layer.
- Consume sibling tokens when the failure cap is reached.

**Acceptance:** the 4th reset request for one phone in an hour answers `202` but sends nothing; after
5 wrong codes a correct code is still rejected during the block window.

---

## Step 5 — Concurrency fixes (F-16, F-17, F-18)

1. `lib/payments/refund.ts`: atomic claim before the provider call:

   ```ts
   const claimed = await tx.payment.updateMany({
     where: { id, refundedCents: { lte: amountCents - input.amountCents } },
     data: { refundedCents: { increment: input.amountCents } },
   })
   ```

   Create the `Refund` row as `PENDING`, call Mercado Pago, then mark `SUCCEEDED`; on provider
   failure mark `FAILED` and decrement `refundedCents` in the same transaction.
   Add `Refund.status` and a DB check `refunded_cents <= amount_cents`.
2. Duplicate guard: same payment + amount + reason within 10 s → `409 invalid_amount`.
3. `markAppointmentNoShow`: conditional `updateMany` on `status IN (PENDING, CONFIRMED)`, increment
   only when `count === 1`.
4. `createOrder`: catch `P2034`/`40001`, retry once, then `409 stock_unavailable` / `slot_taken`.
   Review insert: catch `P2002` → `409 already_reviewed`.

**Acceptance:** five concurrent R$ 30 refunds on R$ 100 → at most 3 succeed and
`refundedCents === sum(refunds)`; two concurrent no-show calls increment once; two concurrent
last-unit orders → one clean `409`; two concurrent reviews → one `already_reviewed`.

---

## Step 6 — Order access token (F-05)

1. `Order.publicToken String @unique` (32 random bytes, base64url) + migration; backfill existing
   rows.
2. `app/pedido/[code]/page.tsx`: allow when the session owns the order, is assigned staff, or is
   OWNER; otherwise require `searchParams.t` to match; mismatch → `notFound()`.
3. Include `?t=` in every generated link: `lib/notifications/dispatch.ts`,
   `lib/payments/mercado-pago.ts` callback, `components/cart/CartContents.tsx` redirect, and the
   confirmation email.
4. No `/pedido/*` rate limiter: a 256-bit token removes the enumeration oracle.

**Acceptance:** anonymous `GET /pedido/<code>` → `404`; the token link → `200`; the owning customer's
session → `200`.

---

## Step 7 — Enumeration oracles (F-06)

1. `registerUser`: existing contact → same generic `202` response, send an "account exists, sign in or
   reset" email; no `409`.
2. `loginUser`: unknown identifier verifies against a fixed dummy Argon2 hash.
3. `requestPasswordReset`: identical work and `202` for every identifier; delivery moves to
   `after()`.
4. Keep the per-identifier rate limits from steps 3–4.

**Acceptance:** login medians for existing vs missing accounts differ by less than ~20%; registration
responses are byte-identical for new and existing contacts.

---

## Step 8 — Hardening bundle

**A — Webhook (F-13):** fail closed when `MERCADO_PAGO_WEBHOOK_SECRET` is missing in production;
reject `ts` older than 5 min; assert provider amount `>= order.totalCents`.

**B — Sessions (F-09):** absolute `expiresAt` cap (7 days staff, 30 days customer); rotate the token
when the role changes. Step 9 adds the list/revoke UI.

**D — Ops hygiene:** image `remotePatterns` → `images.unsplash.com` only; dependency updates and a
CI gate at `--audit-level=critical` (the Prisma 7 / deepmerge-ts high advisory was cleared in step
11); `/.well-known/security.txt`; `Cross-Origin-Opener-Policy` and
`Cross-Origin-Resource-Policy` set to `same-origin`; truncate the Mercado Pago error body; password
denylist at registration.

**F-10:** `assertSameOrigin` rejects a foreign `Origin` and now also a foreign `Referer`; requests
with neither header still pass because cron, webhook, and non-browser clients authenticate
separately. Tightening further would break those clients.

**E — Audit log:** `AuditLog { id, actorId, action, entity, entityId, detail Json, createdAt }`
written by refunds, customer blocks, price changes, and role changes. No UI yet.

**F-10:** see D.

**Acceptance:** webhook tests for missing secret / stale `ts` / underpayment; session expiry test;
`npm audit --omit=dev --audit-level=critical` clean; headers pass a browser smoke test.

---

## Step 9 — Session UI and response headers

1. `GET /api/sessions` lists the caller's unexpired sessions, marking the current one.
2. `DELETE /api/sessions?id=` revokes one own session (and clears the cookie when it is the current
   one); `DELETE /api/sessions` revokes every other session.
3. `ActiveSessions` card on `/conta/perfil` and the admin dashboard.
4. `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin`.

**Acceptance:** a user cannot revoke another user's session; "encerrar outras sessões" leaves the
current one alive; both headers are present on every response.

---

## Step 10 — CSP nonce (F-11)

`proxy.ts` builds the policy per request with a fresh nonce and `'strict-dynamic'`, exposing the
nonce to server components through the `x-nonce` request header. The static CSP in
`next.config.ts` was removed so only one policy is sent. `AnalyticsProvider` and the home page's
JSON-LD script forward the nonce to their inline scripts; GTM's injected `gtm.js` is trusted through
the nonce'd loader.

The policy stays production-only: the dev server needs `eval` and websockets.

**Acceptance:** every inline script carries the same per-response nonce; with consent granted, GTM
loads without a CSP violation.

**Observed 2026-11-09** (local `next start`): one nonce per response, 15 nonced scripts, zero inline
scripts without a nonce, and a headless Chromium run of `/`, `/servicos`, `/entrar` and
`/conta/perfil` reported no CSP violations and loaded `gtm.js`.

---

## Step 11 — Prisma 7 (F-14)

`prisma` and `@prisma/client` move to 7.10.1 and connect through `@prisma/adapter-pg`. The schema
`datasource` keeps only `provider`; `prisma.config.ts` supplies `DIRECT_URL` for migrations and the
adapter takes `DATABASE_URL` at runtime. Prisma 7 no longer loads `.env`, so
`vitest.integration.config.ts` loads it explicitly. See ADR 0012.

**Acceptance:** `npm audit --omit=dev` shows no high or critical advisory; generate, migrate deploy,
build, unit and integration tests all pass; the app renders DB-backed pages against a real database.

**Observed 2026-11-09:** `npm audit --omit=dev` reports 5 moderate (no high/critical), 101 unit and
62 integration tests pass, `prisma migrate status` is clean, and `/` plus `/servicos` render 200 from
a local `next start`.

---

## Accepted risks

| Risk | Why accepted | Revisit |
| --- | --- | --- |
| No MFA on OWNER/BARBER (F-07) | Needs recovery-code UX and schema; lockout closes the practical brute-force path | Dedicated project after P1/P2 |
| Order token links are bearer links | Anyone with the WhatsApp/email link can open the order; that is the delivery channel | Redeem-once is not compatible with re-opening |
| Email registration no longer logs in immediately | Enumeration fix requires a uniform response; verification-first is the secure flow | Revisit onboarding copy after launch |

---

## Rollout

1. Merge `fix/security-p0-p1` after steps 1–7 pass locally.
2. Apply the migration with `npm run db:deploy` (Render runs it at boot).
3. Set `ORIGIN_SHARED_SECRET` and add the Cloudflare rule **before** the deploy that reads it;
   without the rule the fallback still uses rightmost XFF.
4. Set `SEED_DEMO_PASSWORD` in local `.env` and CI; never in production.
5. Re-run the assessment retest list (F-01–F-06, F-16–F-18).
6. ~~Call `GET /api/debug/request-headers` with the cron bearer from production, record the observed
   chain, then delete the route.~~ Done 2026-11-09; see step 3.

## Retest checklist

- [ ] F-01 old password `401` for every seeded account
- [ ] F-02 rotating XFF still hits `429`; per-account lockout at 5
- [ ] F-03 4th OTP issuance sends nothing; 5 failures block 1 h
- [ ] F-04 `?next=%2F%5Cevil.com` stays on site
- [ ] F-05 anonymous order page `404`, token link `200`
- [ ] F-06 timing medians converge; register responses identical
- [ ] F-16 five refunds → ≤3 succeed, totals match
- [ ] F-17 double no-show → one increment
- [ ] F-18 races return clean `409`s
