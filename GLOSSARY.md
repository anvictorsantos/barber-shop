# Glossary — Barbearia do Luiz

One context: a single neighborhood barbershop. These terms are the canonical language for the product, the code, and the docs. If a term is not here, do not invent a synonym for it.

## People

- **Owner** — Luiz. Full access to the shop, all barbers, money, services, products, team, and settings. Also cuts hair and appears in the booking flow.
- **Barber** — A professional who performs services. Has a login. Sees only their own dashboard, agenda, clients, time blocks, and appointments. Hinner and Carlos are barbers. Luiz is an owner who also acts as a barber.
- **Customer** — A person who books services, buys products, earns loyalty stamps, and writes reviews. May start as a guest and receive an account at checkout.
- **Staff** — Owner or barber. Anyone who works in the shop.

## Catalog

- **Service** — A sellable grooming job with a name, category, duration, and price. Examples: Corte + Barba, Barba, Pezinho. A service is booked with a barber and a slot.
- **Service category** — A grouping used on the catalog: Corte, Barba, Corte e Barba, Pezinho, Químicas e Tratamento Capilar.
- **Product** — A physical retail item sold for pickup at the shop. Examples: Pomada Modeladora Matte, Cerveja Stella Artois. Has stock and does not require a slot.
- **Barber profile** — The public identity of a barber: display name, title, avatar, bio, active flag, and rating aggregate.

## Time and availability

- **Shop hours** — The weekly opening and closing times of the shop. Default: Monday–Friday 09:00–20:00, Saturday 09:00–18:00, Sunday closed.
- **Time block** — A range when a barber is unavailable. May be recurring by weekday (for example, daily lunch) or one-off on a date (for example, chair maintenance).
- **Slot** — A candidate start time for a service on a 15-minute grid. A slot is bookable only when it fits inside shop hours, avoids time blocks, and does not overlap an active appointment.
- **Availability** — The set of bookable slots for a barber, service, and local date.
- **Active appointment** — An appointment in `pending` or `confirmed`. Only active appointments block slots.
- **Lead time** — The minimum distance between now and a bookable start. Default: 30 minutes.
- **Horizon** — The furthest date a customer may book. Default: 60 days.
- **Local date** — A calendar date in `America/Sao_Paulo`, used for “today”, agenda columns, and availability.

## Booking and orders

- **Appointment** — One service assigned to one barber at one time. The atomic unit of the queue, availability, revenue, and loyalty.
- **Appointment line** — The same thing as an appointment when it is viewed as part of an order.
- **Order** — The checkout unit. Contains one or more appointments, zero or more product lines, and one payment context. Identified by a code such as `#BL-8472`.
- **Product line** — A product plus quantity and unit price inside an order.
- **Cart** — The customer’s in-progress set of service lines and product lines before an order exists. Lives in the browser.
- **Walk-in** — An appointment created by staff for someone at the shop or on the phone. Source is `walk_in`. Does not require a customer account.
- **Manual booking** — An appointment created by staff from the admin. Includes walk-ins and phone bookings.
- **Multi-line order** — An order with more than one appointment line. Each line has its own barber, date, and time.
- **Hold** — A temporary reservation of slots and stock while an online payment is pending. Default: 15 minutes.
- **Reservation expiry** — The moment an unpaid order stops holding slots and stock.
- **Receipt** — A PDF document for a collected payment.

## Appointment states

- **Pending** — Created but not yet confirmed by the barber. Blocks the slot. Pay-at-chair bookings start here.
- **Confirmed** — Accepted by the barber, or confirmed automatically because an online payment succeeded. Blocks the slot.
- **Completed** — The service was delivered. Earns revenue, a loyalty stamp, and a review prompt.
- **No-show** — The customer did not appear. Earns no revenue and no stamp. Counts toward the no-show block.
- **Canceled** — Canceled more than 2 hours before the start. Frees the slot. Refundable if prepaid.
- **Late cancel** — Canceled 2 hours or less before the start. Frees the slot. Not refundable.
- **Reschedule** — Moving an existing appointment line to a new barber or time without creating a new appointment identity.
- **Source** — How an appointment was created: `online`, `walk_in`, or `manual`.

## Money

- **Price** — The amount charged for a service or product, stored in integer cents.
- **Revenue** — Money actually collected: paid online orders plus completed pay-at-chair services, minus refunds. Pending, canceled, and no-show appointments contribute nothing.
- **Pay at chair** — Payment collected in person by cash, card, or PIX after the service. Allowed only for service-only orders.
- **Online payment** — Prepayment through Mercado Pago by PIX, credit card, or debit card. Required when the order contains products.
- **Refund** — Money returned for a canceled line or product before pickup. Partial refunds are allowed on online orders.
- **Order status** — `pending_payment`, `open`, `paid`, `partially_refunded`, `refunded`, `canceled`, or `expired`.

## Loyalty

- **Loyalty stamp** — One mark earned per completed service appointment. Products earn no stamps.
- **Loyalty credit** — A free service earned at 15 stamps. One active credit at a time, valid for 90 days, applied to one service line at checkout.
- **Tier** — The customer’s loyalty level by lifetime completed visits: Bronze (0–9), Gold (10–19), Platinum (20+).
- **Lifetime visits** — Count of completed service appointments. Never decreases.

## Feedback and saved items

- **Review** — A 1–5 star rating for a completed appointment, with an optional private comment. One review per appointment. Only the average and count are public.
- **Favorite** — A barber, service, or product saved by a customer for quick access.
- **Repeat** — Rebooking the customer’s most recent service with the same barber, subject to availability.

## Platform

- **Guest checkout** — A customer can order without an account. An account is created at checkout and activated later by setting a password.
- **Demo mode** — A non-production mode with seeded data and one-click logins for owner, barber, and customer.
- **Disposable email** — A temporary mailbox domain rejected at registration. Checked by domain only.
- **Notification** — A transactional message sent by WhatsApp or email. Kinds: confirmation, reminder, cancellation, reschedule, receipt, verification, reset, no-show block.
- **Add to calendar** — An ICS download and a Google Calendar link in the confirmation email and page. Not a two-way calendar sync.
