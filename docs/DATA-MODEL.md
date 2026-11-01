# DATA-MODEL — Barbearia do Luiz

> Domain model, invariants, and persistence shape. This is the contract for Prisma, APIs, and tests.

## Conventions

- Money: integer cents (`priceCents`, `amountCents`). Never floats.
- Time: `timestamptz` in UTC. Business dates and weekdays use `America/Sao_Paulo`.
- Dates without time (`birthDate`, one-off block date) use `date`.
- IDs: `cuid()` strings.
- Enums: uppercase labels in code and database.
- Tables: snake_case via `@@map`. Columns: snake_case via `@map`.
- Deletion: soft delete only where history matters (`active` flags). Orders, payments, and appointments are never hard-deleted.

## Enums

```prisma
enum Role { CUSTOMER BARBER OWNER }

enum ServiceCategory { CORTE BARBA COMBO PEZINHO QUIMICA }

enum AppointmentStatus { PENDING CONFIRMED COMPLETED NO_SHOW CANCELED CANCELED_LATE }
enum AppointmentSource { ONLINE WALK_IN MANUAL }

enum OrderStatus { PENDING_PAYMENT OPEN PAID PARTIALLY_REFUNDED REFUNDED CANCELED EXPIRED }
enum OrderPaymentMode { ONLINE ON_SITE }

enum PaymentProvider { MERCADO_PAGO MANUAL }
enum PaymentMethod { PIX CREDIT_CARD DEBIT_CARD CASH }
enum PaymentStatus { PENDING PAID FAILED REFUNDED PARTIALLY_REFUNDED }

enum LoyaltyTier { BRONZE GOLD PLATINUM }
enum LoyaltyEntryType { STAMP CREDIT_ISSUED CREDIT_USED ADJUSTMENT }
enum LoyaltyCreditStatus { AVAILABLE USED EXPIRED }

enum NotificationChannel { WHATSAPP EMAIL }
enum NotificationKind {
  BOOKING_CONFIRMATION REMINDER CANCELED RESCHEDULED RECEIPT
  NO_SHOW_BLOCK OTP EMAIL_VERIFY PASSWORD_RESET
}
enum NotificationStatus { QUEUED SENT FAILED SKIPPED }

enum VerificationPurpose { EMAIL_VERIFY PHONE_OTP PASSWORD_RESET ACCOUNT_ACTIVATION }

enum InventoryMovementType { RESERVE RELEASE SALE REFUND ADJUST }
```

## Entities

### Shop

Singleton row. Name, CNPJ, address, city, state, postal code, phone, WhatsApp, email, timezone. The app refuses to start without exactly one shop row.

### User

Account for customer, barber, or owner.

- `name`
- `email?` unique, normalized lowercase
- `emailVerifiedAt?`
- `phone?` unique, E.164
- `phoneVerifiedAt?`
- `passwordHash?` — null only for guest-created accounts awaiting activation
- `role`
- `cpf?`, `birthDate?`, address fields
- `noShowCount` default 0
- `bookingBlocked` default false
- `blockedAt?`
- timestamps

### Session

- `tokenHash` unique (SHA-256 of opaque token)
- `userId`
- `expiresAt`, `lastUsedAt`, `createdAt`
- `ip?`, `userAgent?`

### VerificationToken

- `userId?`
- `identifier` — normalized email or E.164 phone
- `channel` — `EMAIL` or `WHATSAPP`
- `purpose` — `EMAIL_VERIFY`, `PHONE_OTP`, `PASSWORD_RESET`, `ACCOUNT_ACTIVATION`- `tokenHash` unique
- `expiresAt`, `consumedAt?`, `attempts` default 0

### BarberProfile

- `userId` unique
- `displayName`, `title`, `bio?`, `avatarUrl?`
- `active`, `sortOrder`
- `ratingAvg` (cached decimal), `ratingCount` (cached int)

Luiz has both `role = OWNER` and a `BarberProfile`. Hinner and Carlos have `role = BARBER` and a `BarberProfile`.

### Service

- `slug` unique, `name`, `description`
- `category`
- `durationMin` 10–90
- `priceCents`
- `originalPriceCents?`, `promoLabel?`
- `imageUrl?`
- `active`, `sortOrder`

### Product

- `slug` unique, `name`, `description`, `priceCents`
- `stock` — physical units
- `reserved` — units held by unpaid orders
- `imageUrl?`, `active`
- Available to sell = `stock - reserved`

### ShopHours

- `weekday` unique 0–6 (0 = Sunday)
- `openMinute`, `closeMinute` (minutes from midnight)
- `closed`

### TimeBlock

- `barberId`
- `label`
- `recurring` boolean
- `weekday?` for recurring
- `date?` for one-off
- `startMinute`, `endMinute`
- `active`

### Appointment

- `orderId`
- `customerId?` — null for walk-ins with no account
- `barberId`
- `serviceId`
- `startAt`, `endAt`
- `status`
- `source`
- `priceCents` — snapshot at booking
- `note?`
- `createdById?` — staff member who created a manual booking
- `rescheduledFromId?` — self relation
- `canceledAt?`, `completedAt?`, `noShowAt?`
- `createdAt`, `updatedAt`

### Order

- `code` unique — `BL-#####`. The UI renders it with a leading `#`; the stored value has no `#` so it is safe in URLs.
- `customerId?`
- `customerName`, `customerPhone?`, `customerEmail?` — snapshots for walk-ins/history
- `status`
- `paymentMode`
- `serviceCents`, `productCents`, `creditCents`, `totalCents`
- `expiresAt?` — online hold
- `paidAt?`, `canceledAt?`
- `note?`
- timestamps

### OrderProduct

- `orderId`, `productId`
- `quantity`
- `unitPriceCents`, `lineTotalCents`

### Payment

- `orderId`
- `appointmentId?` — set for at-chair per-appointment payments
- `provider`
- `providerPaymentId?` unique
- `method`
- `status`
- `amountCents`
- `refundedCents` default 0
- `paidAt?`
- `createdAt`, `updatedAt`

### Refund

- `paymentId`
- `appointmentId?` — set when the refund is for a service line
- `orderProductId?` — set when the refund is for a product line
- `amountCents`
- `reason`
- `providerRefundId?`
- `createdAt`

A refund points at the payment and at the line it reverses. This keeps partial refunds reconcilable.

### Review

- `appointmentId` unique
- `customerId`, `barberId`
- `rating` 1–5
- `comment?` — private, owner-visible
- `createdAt`

### LoyaltyAccount

- `userId` unique
- `stamps` 0–15
- `lifetimeVisits`
- `tier`

### LoyaltyEntry

Append-only ledger.

- `accountId`
- `type`
- `deltaStamps`
- `appointmentId?`, `creditId?`
- `note?`
- `createdAt`

### LoyaltyCredit

- `accountId`
- `status`
- `expiresAt`
- `usedOrderId?`, `usedAt?`
- `createdAt`

At most one `AVAILABLE` credit per account, enforced by a partial unique index.

### Favorites

Three join tables, each with a composite unique:

- `FavoriteBarber (userId, barberId)`
- `FavoriteService (userId, serviceId)`
- `FavoriteProduct (userId, productId)`

### NotificationLog

- `userId?`, `orderId?`, `appointmentId?`
- `channel`, `kind`, `status`
- `dedupeKey` unique — e.g. `reminder:<appointmentId>:WHATSAPP`
- `providerId?`, `error?`
- `sentAt?`, `createdAt`

### InventoryMovement

- `productId`, `orderId?`
- `type`
- `quantity`
- `note?`
- `createdAt`

## Prisma outline

```prisma
model Shop {
  id          String   @id @default(cuid())
  name        String
  cnpj        String?
  addressLine String
  city        String
  state       String
  postalCode  String?
  phone       String?
  whatsapp    String
  email       String?
  timezone    String   @default("America/Sao_Paulo")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("shops")
}

model User {
  id              String    @id @default(cuid())
  name            String
  email           String?   @unique
  emailVerifiedAt DateTime?
  phone           String?   @unique
  phoneVerifiedAt DateTime?
  passwordHash    String?
  role            Role      @default(CUSTOMER)
  cpf             String?
  birthDate       DateTime? @db.Date
  addressLine     String?
  city            String?
  state           String?
  postalCode      String?
  noShowCount     Int       @default(0)
  bookingBlocked  Boolean   @default(false)
  blockedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  barberProfile BarberProfile?
  sessions      Session[]
  appointments  Appointment[]
  orders        Order[]
  loyalty       LoyaltyAccount?
  reviews       Review[]

  @@map("users")
}

model Session {
  id         String   @id @default(cuid())
  tokenHash  String   @unique
  userId     String
  expiresAt  DateTime
  lastUsedAt DateTime @default(now())
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  id         String    @id @default(cuid())
  userId     String?
  identifier String
  channel    NotificationChannel
  purpose    String
  tokenHash  String    @unique
  expiresAt  DateTime
  consumedAt DateTime?
  attempts   Int       @default(0)
  createdAt  DateTime  @default(now())

  @@index([identifier, purpose])
  @@map("verification_tokens")
}

model BarberProfile {
  id          String  @id @default(cuid())
  userId      String  @unique
  displayName String
  title       String
  bio         String?
  avatarUrl   String?
  active      Boolean @default(true)
  sortOrder   Int     @default(0)
  ratingAvg   Decimal @default(0) @db.Decimal(3, 2)
  ratingCount Int     @default(0)

  user         User          @relation(fields: [userId], references: [id])
  appointments Appointment[]
  timeBlocks   TimeBlock[]
  reviews      Review[]
  favorites    FavoriteBarber[]

  @@map("barber_profiles")
}

model Service {
  id                 String          @id @default(cuid())
  slug               String          @unique
  name               String
  description        String
  category           ServiceCategory
  durationMin        Int
  priceCents         Int
  originalPriceCents Int?
  promoLabel         String?
  imageUrl           String?
  active             Boolean         @default(true)
  sortOrder          Int             @default(0)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  appointments Appointment[]
  favorites    FavoriteService[]

  @@map("services")
}

model Product {
  id          String  @id @default(cuid())
  slug        String  @unique
  name        String
  description String
  priceCents  Int
  stock       Int     @default(0)
  reserved    Int     @default(0)
  imageUrl    String?
  active      Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  orderLines OrderProduct[]
  movements  InventoryMovement[]
  favorites  FavoriteProduct[]

  @@map("products")
}

model ShopHours {
  id         String  @id @default(cuid())
  weekday    Int     @unique
  openMinute Int
  closeMinute Int
  closed     Boolean @default(false)

  @@map("shop_hours")
}

model TimeBlock {
  id          String    @id @default(cuid())
  barberId    String
  label       String
  recurring   Boolean   @default(false)
  weekday     Int?
  date        DateTime? @db.Date
  startMinute Int
  endMinute   Int
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())

  barber BarberProfile @relation(fields: [barberId], references: [id])

  @@index([barberId, weekday])
  @@index([barberId, date])
  @@map("time_blocks")
}

model Appointment {
  id              String            @id @default(cuid())
  orderId         String
  customerId      String?
  barberId        String
  serviceId       String
  startAt         DateTime          @db.Timestamptz(3)
  endAt           DateTime          @db.Timestamptz(3)
  status          AppointmentStatus @default(PENDING)
  source          AppointmentSource @default(ONLINE)
  priceCents      Int
  note            String?
  createdById     String?
  rescheduledFromId String?
  canceledAt      DateTime?
  completedAt     DateTime?
  noShowAt        DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  order         Order          @relation(fields: [orderId], references: [id])
  customer      User?          @relation(fields: [customerId], references: [id])
  barber        BarberProfile  @relation(fields: [barberId], references: [id])
  service       Service        @relation(fields: [serviceId], references: [id])
  review        Review?
  payments      Payment[]
  refunds       Refund[]
  rescheduledFrom Appointment? @relation("Reschedule", fields: [rescheduledFromId], references: [id])
  rescheduledTo   Appointment[] @relation("Reschedule")

  @@index([barberId, startAt])
  @@index([customerId, startAt])
  @@index([orderId])
  @@index([status, startAt])
  @@map("appointments")
}

model Order {
  id             String           @id @default(cuid())
  code           String           @unique
  customerId     String?
  customerName   String
  customerPhone  String?
  customerEmail  String?
  status         OrderStatus
  paymentMode    OrderPaymentMode
  serviceCents   Int              @default(0)
  productCents   Int              @default(0)
  creditCents    Int              @default(0)
  totalCents     Int
  expiresAt      DateTime?
  paidAt         DateTime?
  canceledAt     DateTime?
  note           String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  customer     User?          @relation(fields: [customerId], references: [id])
  appointments Appointment[]
  products     OrderProduct[]
  payments     Payment[]

  @@index([customerId, createdAt])
  @@index([status, expiresAt])
  @@map("orders")
}

model OrderProduct {
  id             String @id @default(cuid())
  orderId        String
  productId      String
  quantity       Int
  unitPriceCents Int
  lineTotalCents Int

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
  refunds Refund[]

  @@index([productId])
  @@map("order_products")
}

model Payment {
  id                String          @id @default(cuid())
  orderId           String
  appointmentId     String?
  provider          PaymentProvider
  providerPaymentId String?         @unique
  method            PaymentMethod
  status            PaymentStatus
  amountCents       Int
  refundedCents     Int             @default(0)
  paidAt            DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  order       Order       @relation(fields: [orderId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id])
  refunds     Refund[]

  @@index([orderId])
  @@map("payments")
}

model Refund {
  id               String   @id @default(cuid())
  paymentId        String
  appointmentId    String?
  orderProductId   String?
  amountCents      Int
  reason           String
  providerRefundId String?
  createdAt        DateTime @default(now())

  payment      Payment       @relation(fields: [paymentId], references: [id])
  appointment  Appointment?  @relation(fields: [appointmentId], references: [id])
  orderProduct OrderProduct? @relation(fields: [orderProductId], references: [id])

  @@index([paymentId])
  @@map("refunds")
}

model Review {
  id            String   @id @default(cuid())
  appointmentId String   @unique
  customerId    String
  barberId      String
  rating        Int
  comment       String?
  createdAt     DateTime @default(now())

  appointment Appointment   @relation(fields: [appointmentId], references: [id])
  customer    User          @relation(fields: [customerId], references: [id])
  barber      BarberProfile @relation(fields: [barberId], references: [id])

  @@index([barberId])
  @@map("reviews")
}

model LoyaltyAccount {
  id             String      @id @default(cuid())
  userId         String      @unique
  stamps         Int         @default(0)
  lifetimeVisits Int         @default(0)
  tier           LoyaltyTier @default(BRONZE)
  updatedAt      DateTime    @updatedAt

  user    User           @relation(fields: [userId], references: [id])
  entries LoyaltyEntry[]
  credits LoyaltyCredit[]

  @@map("loyalty_accounts")
}

model LoyaltyEntry {
  id            String           @id @default(cuid())
  accountId     String
  type          LoyaltyEntryType
  deltaStamps   Int              @default(0)
  appointmentId String?
  creditId      String?
  note          String?
  createdAt     DateTime         @default(now())

  account LoyaltyAccount @relation(fields: [accountId], references: [id])

  @@index([accountId, createdAt])
  @@map("loyalty_entries")
}

model LoyaltyCredit {
  id        String              @id @default(cuid())
  accountId String
  status    LoyaltyCreditStatus @default(AVAILABLE)
  expiresAt DateTime
  usedOrderId String?
  usedAt    DateTime?
  createdAt DateTime            @default(now())

  account LoyaltyAccount @relation(fields: [accountId], references: [id])

  @@index([accountId, status])
  @@map("loyalty_credits")
}

model FavoriteBarber {
  userId   String
  barberId String
  createdAt DateTime @default(now())

  user   User          @relation(fields: [userId], references: [id])
  barber BarberProfile @relation(fields: [barberId], references: [id])

  @@id([userId, barberId])
  @@map("favorite_barbers")
}

// FavoriteService and FavoriteProduct follow the same shape.

model NotificationLog {
  id            String             @id @default(cuid())
  userId        String?
  orderId       String?
  appointmentId String?
  channel       NotificationChannel
  kind          NotificationKind
  status        NotificationStatus
  dedupeKey     String?            @unique
  providerId    String?
  error         String?
  sentAt        DateTime?
  createdAt     DateTime           @default(now())

  @@index([status, createdAt])
  @@map("notification_logs")
}

model InventoryMovement {
  id        String                @id @default(cuid())
  productId String
  orderId   String?
  type      InventoryMovementType
  quantity  Int
  note      String?
  createdAt DateTime              @default(now())

  product Product @relation(fields: [productId], references: [id])

  @@index([productId, createdAt])
  @@map("inventory_movements")
}
```

## Raw SQL constraints

Beyond Prisma schema, add these in a migration:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
ADD CONSTRAINT appointments_active_no_overlap
EXCLUDE USING gist (
  barber_id WITH =,
  tstzrange(start_at, end_at) WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED'));

CREATE UNIQUE INDEX loyalty_credit_one_available
ON loyalty_credits (account_id)
WHERE status = 'AVAILABLE';

ALTER TABLE products
ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0),
ADD CONSTRAINT products_reserved_non_negative CHECK (reserved >= 0),
ADD CONSTRAINT products_reserved_le_stock CHECK (reserved <= stock);

ALTER TABLE order_products
ADD CONSTRAINT order_products_quantity_positive CHECK (quantity > 0);

ALTER TABLE reviews
ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE time_blocks
ADD CONSTRAINT time_blocks_shape CHECK (
  (recurring = true AND weekday IS NOT NULL AND date IS NULL) OR
  (recurring = false AND weekday IS NULL AND date IS NOT NULL)
);

ALTER TABLE appointments
ADD CONSTRAINT appointments_time_order CHECK (end_at > start_at),
ADD CONSTRAINT appointments_price_non_negative CHECK (price_cents >= 0);

ALTER TABLE services
ADD CONSTRAINT services_duration_range CHECK (duration_min BETWEEN 10 AND 90),
ADD CONSTRAINT services_price_non_negative CHECK (price_cents >= 0);

ALTER TABLE products
ADD CONSTRAINT products_price_non_negative CHECK (price_cents >= 0);

ALTER TABLE payments
ADD CONSTRAINT payments_refund_le_amount CHECK (refunded_cents BETWEEN 0 AND amount_cents);

ALTER TABLE loyalty_accounts
ADD CONSTRAINT loyalty_stamps_range CHECK (stamps BETWEEN 0 AND 15);
```

The exclusion constraint is the final line of defense against double-booking, including two simultaneous checkouts. Application-level validation is still required for friendly errors.

## Slot algorithm

Input: `barberId`, `serviceId`, local date, current time.

1. Load service duration and shop hours for the local weekday.
2. If closed, return empty.
3. Candidate starts: from `openMinute` to `closeMinute - durationMin`, step 15.
4. Drop candidates before `now + 30 minutes` when the date is today.
5. Drop candidates where `[start, start + duration)` overlaps an appointment with status `PENDING` or `CONFIRMED`.
6. Drop candidates that overlap an active time block:
   - recurring block with `weekday` equal to the local weekday, or
   - one-off block with `date` equal to the local date.
7. Return sorted slots with `{ time, available, reason? }`.

For a multi-line cart, repeat per line and additionally reject overlaps between lines of the same barber in the same order.

## Order lifecycle

```
ONLINE:
  create order ──► PENDING_PAYMENT (15 min hold)
     ├─ webhook paid ──► PAID
     │     appointments: PENDING ──► CONFIRMED
     ├─ hold expires ──► EXPIRED
     │     appointments: PENDING ──► CANCELED
     └─ checkout fails/canceled ──► CANCELED
           appointments: PENDING ──► CANCELED

ON_SITE (service-only):
  create order ──► OPEN
     appointments: PENDING
     barber confirms ──► CONFIRMED
     barber completes ──► COMPLETED + Payment PAID
     order ──► PAID when all appointments are collected
```

Refunds move `PAID` to `PARTIALLY_REFUNDED` or `REFUNDED`. Refunds never mutate `revenue` directly; finance computes `sum(payments.amountCents - payments.refundedCents)`.

## Stock lifecycle

- Order creation (online): `reserved += quantity`.
- Payment paid: `stock -= quantity`, `reserved -= quantity`.
- Order expired/canceled: `reserved -= quantity`.
- Product refund before pickup: `stock += quantity`.
- Manual adjustment: `stock` changes with an `ADJUST` movement.

Every change writes an `InventoryMovement`.

## Loyalty lifecycle

On appointment `COMPLETED`:

1. `lifetimeVisits += 1`.
2. Recompute tier: BRONZE < 10, GOLD 10–19, PLATINUM 20+.
3. If an `AVAILABLE` credit exists: keep `stamps` at 15 if already there; otherwise increment up to 15.
4. If no `AVAILABLE` credit:
   - `stamps += 1`.
   - If `stamps == 15`: create `LoyaltyCredit` expiring in 90 days, reset `stamps = 0`, write `CREDIT_ISSUED`.
5. Write `STAMP` entry with `appointmentId`.

On checkout using a credit:

- Mark credit `USED`, set `usedOrderId`, `creditCents = line price`, write `CREDIT_USED`.
- If the order expires or is canceled before payment, restore credit to `AVAILABLE` and clear `usedOrderId`/`usedAt`.

Expired credits are swept by a cron and marked `EXPIRED`.

## No-show lifecycle

- Barber marks `NO_SHOW` on own appointment.
- `user.noShowCount += 1`.
- At 3, `bookingBlocked = true`, `blockedAt = now`, send notification.
- Owner unblocks: `bookingBlocked = false`, `noShowCount = 0`, `blockedAt = null`.
- Blocked customers cannot create online orders. Staff can still create manual bookings.

## Concurrency rules

- Order creation runs in a serializable transaction.
- Appointment insert relies on the exclusion constraint; a conflict aborts the transaction with a user-facing “slot taken” error.
- Stock reservation uses a conditional update:
  `UPDATE products SET reserved = reserved + $qty WHERE id = $id AND stock - reserved >= $qty`.
- Mercado Pago webhook is idempotent by `providerPaymentId` and order status guards.
- Reminder cron uses `NotificationLog.dedupeKey` uniqueness to send once.

## Time and locale

- Store UTC.
- Convert with `date-fns-tz` using the shop timezone.
- “Today” is the local date in `America/Sao_Paulo`.
- Weekday 0 = Sunday in both `ShopHours` and `TimeBlock`.
- Minutes from midnight are integers, never `HH:mm` strings in the database.

## Notes

- A walk-in with no customer account has `customerId = null` and an order snapshot name/phone.
- A guest checkout creates a `User` with `passwordHash = null`; activation sets the password.
- An appointment always belongs to an order, including walk-ins.
- Products are pickup-only. There is no shipping address model.
- Receipts are generated from `Payment` rows on demand; no PDF is stored.
