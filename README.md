# Barbearia do Luiz

Single-shop booking and commerce app. Next.js + TypeScript + Prisma + PostgreSQL.

The product is not built yet. This repository currently contains the foundation: strict TypeScript, Tailwind tokens, ESLint, Prettier, Husky, GTM with consent, Sentry, Playwright, Vitest, a full Prisma schema with migrations and seed, auth routes and sessions, login/signup/verification/reset screens, public catalog, service detail, store, owner catalog CRUD, role-scoped layout shells, UI primitives, and a Render blueprint.

## Requirements

- Node 22.18+ (`.nvmrc`)
- npm
- PostgreSQL 16+ for Prisma work

## Setup

```bash
cp .env.example .env
docker compose up -d          # local Postgres, or point DATABASE_URL/DIRECT_URL at Neon
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs at `http://localhost:3000`. The health endpoint is `/api/health`.

## Scripts

```bash
npm run dev          # Next dev server
npm run build        # prisma generate + next build
npm run start        # next start
npm run lint         # ESLint
npm run lint:fix
npm run format       # Prettier
npm run format:check
npm run typecheck    # tsc --noEmit, strict
npm test             # Vitest unit tests
npm run test:integration
npm run test:e2e     # Playwright; shell tests need E2E_SEEDED=true after db:seed
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:reset
npm run db:studio
```

## Configuration

### TypeScript

Strict mode plus `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, and `noFallthroughCasesInSwitch`. `npm run typecheck` is mandatory in CI.

### Tailwind

Tailwind 4 with `@tailwindcss/postcss`. `tailwind.config.js` maps the design tokens to utility names. The token values live in `app/globals.css`. Use `bg-surface`, `text-accent`, `border-border`, `rounded-xl`, `text-body`, and the other mapped names instead of arbitrary values.

### Google Tag Manager

- Set `NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX`.
- GTM loads only after the visitor accepts the consent banner.
- The GA4 tag inside the GTM container must set `send_page_view: false`. The app pushes `page_view` on route changes through `lib/analytics/gtm.ts`.
- Events are typed in `lib/analytics/events.ts`. Never push email, phone, CPF, names, or IDs.
- Consent is stored in `localStorage` under `bl.analytics.consent.v1`.

### Sentry

- Client: `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENV`.
- Server/edge: `SENTRY_DSN`, `SENTRY_ENV`, `SENTRY_RELEASE`.
- Source maps: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- The SDK reports through the same-origin tunnel `/api/sentry`, so ad blockers do not drop events.
- PII is off (`sendDefaultPii: false`), headers are scrubbed, and replay masks all text and media when enabled.
- Sentry is silent when no DSN is configured.

### Render

`render.yaml` defines one Next.js web service:

- Build: `npm ci && npm run build`
- Start: `npm run db:deploy && npm start`
- Health: `/api/health`
- Database: external Neon/Render Postgres through `DATABASE_URL` and `DIRECT_URL`
- Cron jobs are added in Phase 5, after their route handlers exist.

### ESLint and Prettier

ESLint 9 flat config for Next, React, hooks, accessibility, import order, `@/` alias-only imports, and TypeScript. Prettier owns formatting. Husky runs `lint-staged` on commit.

## Docs

- `docs/PRD.md` — product requirements.
- `docs/DATA-MODEL.md` — domain and persistence.
- `docs/BUILD-PLAN.md` — phases and deployment.
- `docs/DESIGN-GUIDELINES.md` — visual system.
- `docs/adr/` — decisions.
- `GLOSSARY.md` — canonical terms.
