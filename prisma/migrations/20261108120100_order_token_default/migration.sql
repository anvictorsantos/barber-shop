-- Orders created outside the app (seed, tests, scripts) still get an unguessable access token.
ALTER TABLE "orders"
ALTER COLUMN "public_token"
SET DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
