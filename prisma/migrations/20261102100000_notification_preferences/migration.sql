ALTER TABLE "users"
  ADD COLUMN "notify_email" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notify_whatsapp" BOOLEAN NOT NULL DEFAULT true;
