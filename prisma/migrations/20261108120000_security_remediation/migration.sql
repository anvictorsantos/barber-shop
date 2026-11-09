-- Order access token (F-05)
ALTER TABLE "orders" ADD COLUMN "public_token" TEXT;
UPDATE "orders"
SET "public_token" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
ALTER TABLE "orders" ALTER COLUMN "public_token" SET NOT NULL;
CREATE UNIQUE INDEX "orders_public_token_key" ON "orders"("public_token");

-- Refund claim state (F-16)
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
ALTER TABLE "refunds" ADD COLUMN "status" "RefundStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "refunds" ADD COLUMN "failed_reason" TEXT;
UPDATE "refunds" SET "status" = 'SUCCEEDED';
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_within_amount" CHECK ("refunded_cents" <= "amount_cents");

-- Shared rate-limit counters (F-02, F-08)
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- Audit trail for sensitive staff actions (F-15)
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
