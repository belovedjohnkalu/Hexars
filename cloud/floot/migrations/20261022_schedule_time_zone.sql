-- Account-local calendar preference; initialized once from a validated detected
-- IANA zone. NULL preserves existing accounts until their next Home load.
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_zone text;
