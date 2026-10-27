CREATE TABLE ion_public_snapshots (
  key text PRIMARY KEY,
  payload jsonb,
  fingerprint text,
  valid_until timestamptz NOT NULL DEFAULT '-infinity',
  lease_id uuid,
  lease_until timestamptz NOT NULL DEFAULT '-infinity',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ion_catalog_signal (
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  lease_id uuid,
  lease_until timestamptz NOT NULL DEFAULT '-infinity'
);
INSERT INTO ion_catalog_signal(id) VALUES(true);
