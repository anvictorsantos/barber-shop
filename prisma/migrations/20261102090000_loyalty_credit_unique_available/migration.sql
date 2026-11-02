CREATE UNIQUE INDEX "loyalty_credit_one_available"
  ON "loyalty_credits"("account_id")
  WHERE "status" = 'AVAILABLE';
