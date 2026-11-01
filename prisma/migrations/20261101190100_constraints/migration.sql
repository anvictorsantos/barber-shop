CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_active_no_overlap"
EXCLUDE USING gist (
  "barber_id" WITH =,
  tstzrange("start_at", "end_at") WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_time_order" CHECK ("end_at" > "start_at"),
ADD CONSTRAINT "appointments_price_non_negative" CHECK ("price_cents" >= 0);

CREATE UNIQUE INDEX "loyalty_credits_one_available"
ON "loyalty_credits" ("account_id")
WHERE "status" = 'AVAILABLE';

ALTER TABLE "products"
ADD CONSTRAINT "products_stock_non_negative" CHECK ("stock" >= 0),
ADD CONSTRAINT "products_reserved_non_negative" CHECK ("reserved" >= 0),
ADD CONSTRAINT "products_reserved_le_stock" CHECK ("reserved" <= "stock"),
ADD CONSTRAINT "products_price_non_negative" CHECK ("price_cents" >= 0);

ALTER TABLE "order_products"
ADD CONSTRAINT "order_products_quantity_positive" CHECK ("quantity" > 0),
ADD CONSTRAINT "order_products_price_non_negative" CHECK ("unit_price_cents" >= 0),
ADD CONSTRAINT "order_products_line_total" CHECK ("line_total_cents" = "quantity" * "unit_price_cents");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_cents_non_negative" CHECK (
  "service_cents" >= 0 AND
  "product_cents" >= 0 AND
  "credit_cents" >= 0 AND
  "total_cents" >= 0
),
ADD CONSTRAINT "orders_total_matches_lines" CHECK (
  "total_cents" = "service_cents" + "product_cents" - "credit_cents"
);

ALTER TABLE "payments"
ADD CONSTRAINT "payments_amount_non_negative" CHECK ("amount_cents" >= 0),
ADD CONSTRAINT "payments_refund_le_amount" CHECK ("refunded_cents" BETWEEN 0 AND "amount_cents");

ALTER TABLE "refunds"
ADD CONSTRAINT "refunds_amount_positive" CHECK ("amount_cents" > 0);

ALTER TABLE "reviews"
ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "loyalty_accounts"
ADD CONSTRAINT "loyalty_stamps_range" CHECK ("stamps" BETWEEN 0 AND 15),
ADD CONSTRAINT "loyalty_lifetime_visits_non_negative" CHECK ("lifetime_visits" >= 0);

ALTER TABLE "services"
ADD CONSTRAINT "services_duration_range" CHECK ("duration_min" BETWEEN 10 AND 90),
ADD CONSTRAINT "services_price_non_negative" CHECK ("price_cents" >= 0),
ADD CONSTRAINT "services_original_price_non_negative" CHECK (
  "original_price_cents" IS NULL OR "original_price_cents" >= 0
);

ALTER TABLE "time_blocks"
ADD CONSTRAINT "time_blocks_shape" CHECK (
  ("recurring" = true AND "weekday" IS NOT NULL AND "date" IS NULL) OR
  ("recurring" = false AND "weekday" IS NULL AND "date" IS NOT NULL)
),
ADD CONSTRAINT "time_blocks_weekday_range" CHECK ("weekday" IS NULL OR "weekday" BETWEEN 0 AND 6),
ADD CONSTRAINT "time_blocks_minutes_range" CHECK (
  "start_minute" >= 0 AND "end_minute" <= 1440 AND "end_minute" > "start_minute"
);

ALTER TABLE "shop_hours"
ADD CONSTRAINT "shop_hours_weekday_range" CHECK ("weekday" BETWEEN 0 AND 6),
ADD CONSTRAINT "shop_hours_minutes_range" CHECK (
  "open_minute" >= 0 AND "close_minute" <= 1440 AND
  ("closed" = true OR "close_minute" > "open_minute")
);

ALTER TABLE "users"
ADD CONSTRAINT "users_no_show_count_non_negative" CHECK ("no_show_count" >= 0);

ALTER TABLE "inventory_movements"
ADD CONSTRAINT "inventory_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "verification_tokens"
ADD CONSTRAINT "verification_attempts_non_negative" CHECK ("attempts" >= 0);
