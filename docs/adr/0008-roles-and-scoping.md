# ADR 0008 — Three roles with query-level scoping

- Status: accepted
- Date: 2026-11-01

## Context

The shop has an owner (Luiz) and two barbers (Hinner, Carlos). Luiz also cuts hair and appears in the booking flow. Earlier the plan used two roles with owner and barber merged; that was rejected because each barber needs a login to manage their own agenda, while the owner needs shop-wide money and configuration.

The Figma admin shell shows all sections for the “Administrador”. Barbers must not see shop finance, other barbers’ clients, or catalog management.

## Decision

Three roles: `CUSTOMER`, `BARBER`, `OWNER`.

- Every barber has a `User` with `role = BARBER` and a `BarberProfile`.
- Luiz has `role = OWNER` and a `BarberProfile`.
- The owner sees all data and all admin routes.
- A barber sees only their own dashboard, agenda, clients, appointments, and time blocks.
- A barber may create manual bookings only for themselves and change status only on their own appointments.
- A customer sees only their own orders, appointments, favorites, reviews, and profile.
- Scoping is enforced in the data layer of every query, not only in navigation.
- Admin navigation is generated from the role.

## Consequences

- Every admin query takes an actor and applies a scope.
- The same screens serve owner and barber with different data and navigation.
- Automated tests must cover forbidden access, not just hidden links.
- Finance and settings are owner-only; a barber hitting the route receives 403.
- Adding a manager or receptionist later means a new role or permission table, not a flag.

## Alternatives considered

- **Two roles (owner = barber)** — simpler, but cannot scope Hinner and Carlos.
- **Admin flag on top of a barber role** — workable, but less explicit than three roles.
- **One login for the shop** — no individual accountability and no per-barber queue ownership.
