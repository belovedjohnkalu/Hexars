-- Historical identifier paths and arrival counters stay unchanged. Each record
-- also retains its dev namespace; clients receive namespace + one-based root.
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_unique_idx ON users(lower(btrim(display_name)));
CREATE SEQUENCE IF NOT EXISTS ion_dev_number_seq MINVALUE 0 START WITH 0;
ALTER TABLE ion_dev_accounts ADD COLUMN IF NOT EXISTS dev_number bigint;
WITH numbered AS (SELECT user_id,row_number() OVER (ORDER BY granted_at,user_id)-1 AS number FROM ion_dev_accounts)
UPDATE ion_dev_accounts d SET dev_number=n.number FROM numbered n WHERE d.user_id=n.user_id AND d.dev_number IS NULL;
SELECT setval('ion_dev_number_seq',COALESCE((SELECT max(dev_number)+1 FROM ion_dev_accounts),0),false);
ALTER TABLE ion_dev_accounts ALTER COLUMN dev_number SET DEFAULT nextval('ion_dev_number_seq');
ALTER TABLE ion_dev_accounts ALTER COLUMN dev_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ion_dev_number_unique_idx ON ion_dev_accounts(dev_number);
ALTER TABLE ion_cloud_identifiers ADD COLUMN IF NOT EXISTS dev_number bigint NOT NULL DEFAULT 0;
